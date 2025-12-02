import client, { Channel, ConsumeMessage, Connection, ChannelModel } from "amqplib";
import { RABBITMQ_URI } from "./enviroment";

interface QueueOptions {
    durable?: boolean;
    maxRetries?: number;
    retryDelay?: number; // milliseconds
    enableDLX?: boolean;
}

class RabbitMQManager {
    private connection!: ChannelModel;
    private channels: Map<string, Channel> = new Map();
    private connected: boolean = false;
    private connecting: boolean = false;

    // Constants
    private readonly RETRY_EXCHANGE = "retry.exchange";
    private readonly DLX_EXCHANGE = "dlx.exchange";
    private readonly DLX_QUEUE_SUFFIX = ".dlx";
    private readonly RETRY_QUEUE_SUFFIX = ".retry";

    async connect(): Promise<void> {
        if (this.connected && this.connection) return;

        if (this.connecting) {
            await new Promise(resolve => setTimeout(resolve, 100));
            return this.connect();
        }

        try {
            this.connecting = true;
            console.log("⌛️ Connecting to Rabbit-MQ Server");

            this.connection = await client.connect(RABBITMQ_URI);
            console.log("✅ Rabbit MQ Connection is ready");

            this.connected = true;

            this.connection.on("error", (err) => {
                console.error("❌ RabbitMQ connection error:", err);
                this.connected = false;
                this.channels.clear();
            });

            this.connection.on("close", () => {
                console.log("🔌 RabbitMQ connection closed");
                this.connected = false;
                this.channels.clear();
            });

            // Setup exchanges cho retry và DLX
            await this.setupExchanges();

        } catch (error) {
            console.error("❌ Failed to connect to RabbitMQ:", error);
            this.connected = false;
            throw error;
        } finally {
            this.connecting = false;
        }
    }

    private async setupExchanges(): Promise<void> {
        const channel = await this.getChannel("_system");

        await channel.assertExchange(this.RETRY_EXCHANGE, "direct", { durable: true });

        await channel.assertExchange(this.DLX_EXCHANGE, "direct", { durable: true });

        console.log("🔄 Retry & DLX exchanges created");
    }

    async getChannel(queueName: string): Promise<Channel> {
        if (!this.connection) {
            await this.connect();
        }

        if (this.channels.has(queueName)) {
            return this.channels.get(queueName)!;
        }

        try {
            const channel = await this.connection.createChannel();
            console.log(`🛸 Created RabbitMQ Channel for "${queueName}"`);

            await channel.prefetch(10);

            channel.on("error", (err) => {
                console.error(`❌ Channel "${queueName}" error:`, err);
                this.channels.delete(queueName);
            });

            channel.on("close", () => {
                console.log(`🔌 Channel "${queueName}" closed`);
                this.channels.delete(queueName);
            });

            this.channels.set(queueName, channel);
            return channel;
        } catch (error) {
            console.error(`❌ Failed to create channel for "${queueName}":`, error);
            throw error;
        }
    }

    async assertQueue(queue: string, options: QueueOptions = {}): Promise<void> {
        const {
            durable = true,
            maxRetries = 3,
            retryDelay = 5000,
            enableDLX = true
        } = options;

        const channel = await this.getChannel(queue);

        // 1. Setup DLX Queue (nơi chứa message failed cuối cùng)
        if (enableDLX) {
            const dlxQueue = queue + this.DLX_QUEUE_SUFFIX;
            await channel.assertQueue(dlxQueue, { durable: true });
            await channel.bindQueue(dlxQueue, this.DLX_EXCHANGE, queue);
            console.log(`💀 DLX Queue "${dlxQueue}" created`);
        }

        // 2. Setup Retry Queue (nơi message chờ retry)
        const retryQueue = queue + this.RETRY_QUEUE_SUFFIX;
        await channel.assertQueue(retryQueue, {
            durable: true,
            deadLetterExchange: "", // Route về main queue
            deadLetterRoutingKey: queue,
            messageTtl: retryDelay // Sau X ms thì tự động gửi về main queue
        });
        await channel.bindQueue(retryQueue, this.RETRY_EXCHANGE, queue);
        console.log(`🔄 Retry Queue "${retryQueue}" created (delay: ${retryDelay}ms)`);

        // 3. Setup Main Queue với DLX
        const queueOptions: any = {
            durable,
            deadLetterExchange: this.DLX_EXCHANGE,
            deadLetterRoutingKey: queue
        };

        await channel.assertQueue(queue, queueOptions);
        console.log(`📬 Queue "${queue}" ready with retry (max: ${maxRetries}) & DLX`);
    }

    async sendToQueue(queue: string, message: any): Promise<void> {
        try {
            const channel = await this.getChannel(queue);
            const sent = channel.sendToQueue(
                queue,
                Buffer.from(JSON.stringify(message)),
                {
                    persistent: true,
                    headers: {
                        "x-retry-count": 0
                    }
                }
            );

            if (!sent) {
                console.warn(`⚠️ Message buffer is full for "${queue}", waiting...`);
                await new Promise(resolve => {
                    channel.once("drain", resolve);
                });
            }

            console.log(`✉️ Message sent to queue "${queue}"`);
        } catch (error) {
            console.error(`❌ Failed to send message to "${queue}":`, error);
            throw error;
        }
    }

    async consume(
        queue: string,
        handler: (message: any) => Promise<void>,
        options: QueueOptions = {}
    ): Promise<void> {
        const { maxRetries = 3 } = options;

        try {
            const channel = await this.getChannel(queue);

            await channel.consume(
                queue,
                async (msg: ConsumeMessage | null) => {
                    if (!msg) return;

                    const retryCount = msg.properties.headers?.["x-retry-count"] || 0;

                    try {
                        const content = JSON.parse(msg.content.toString());
                        console.log(`📨 Received message from "${queue}" (retry: ${retryCount}/${maxRetries})`);

                        await handler(content);

                        channel.ack(msg);
                        console.log(`✅ Message processed successfully from "${queue}"`);

                    } catch (error) {
                        console.error(`❌ Error processing message from "${queue}":`, error);

                        // Kiểm tra số lần retry
                        if (retryCount < maxRetries) {
                            await this.retryMessage(queue, msg, retryCount + 1);
                            channel.ack(msg); // Ack message gốc
                            console.log(`🔄 Message sent to retry queue (attempt ${retryCount + 1}/${maxRetries})`);
                        } else {
                            channel.nack(msg, false, false);
                            console.log(`💀 Message moved to DLX after ${maxRetries} retries`);
                        }
                    }
                },
                { noAck: false, ...options }
            );

            console.log(`Listening to queue "${queue}" (max retries: ${maxRetries})`);
        } catch (error) {
            console.error(`Failed to consume messages from "${queue}":`, error);
            throw error;
        }
    }

    private async retryMessage(queue: string, msg: ConsumeMessage, retryCount: number): Promise<void> {
        const channel = await this.getChannel(queue);

        channel.publish(
            this.RETRY_EXCHANGE,
            queue,
            msg.content,
            {
                persistent: true,
                headers: {
                    "x-retry-count": retryCount,
                    "x-original-queue": queue,
                    "x-first-death-reason": msg.properties.headers?.["x-first-death-reason"],
                    "x-retry-timestamp": new Date().toISOString()
                }
            }
        );
    }

    async consumeDLX(queue: string, handler: (message: any) => Promise<void>): Promise<void> {
        const dlxQueue = queue + this.DLX_QUEUE_SUFFIX;
        const channel = await this.getChannel(dlxQueue);

        await channel.consume(
            dlxQueue,
            async (msg: ConsumeMessage | null) => {
                if (!msg) return;

                try {
                    const content = JSON.parse(msg.content.toString());
                    const retryCount = msg.properties.headers?.["x-retry-count"] || 0;

                    console.log(`💀 Processing DLX message from "${queue}" (failed after ${retryCount} retries)`);

                    await handler(content);
                    channel.ack(msg);

                    console.log(`✅ DLX message processed`);
                } catch (error) {
                    console.error(`❌ Error processing DLX message:`, error);
                    channel.nack(msg, false, false);
                }
            }
        );

        console.log(`💀 Listening to DLX queue "${dlxQueue}"`);
    }

    async close(): Promise<void> {
        try {
            for (const [name, channel] of this.channels.entries()) {
                try {
                    await channel.close();
                    console.log(`✓ Channel "${name}" closed`);
                } catch (error) {
                    console.error(`❌ Error closing channel "${name}":`, error);
                }
            }
            this.channels.clear();

            if (this.connection) {
                await this.connection.close();
            }

            this.connected = false;
            console.log("👋 RabbitMQ connection closed");
        } catch (error) {
            console.error("❌ Error closing connection:", error);
        }
    }

    isConnected(): boolean {
        return this.connected;
    }

    getActiveChannelsCount(): number {
        return this.channels.size;
    }
}

const mqManager = new RabbitMQManager();

export default mqManager;