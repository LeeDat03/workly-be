import client, { Channel, ConsumeMessage, Connection, ChannelModel } from "amqplib";
import { RABBITMQ_URI } from "../enviroment";

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

    async sendToQueue(queue: string, message: any): Promise<void> {
        try {
            const channel = await this.getChannel(queue);
            const sent = channel.sendToQueue(
                queue,
                Buffer.from(JSON.stringify(message)),
                {
                    persistent: true,
                    headers: {
                        "x-retry-count": 0 // Khởi tạo retry count
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
                        if (retryCount < maxRetries) {
                            await this.retryMessage(queue, msg, retryCount + 1);
                            channel.ack(msg);
                            console.log(`🔄 Message sent to retry queue (attempt ${retryCount + 1}/${maxRetries})`);
                        } else {
                            channel.nack(msg, false, false);
                            console.log(`💀 Message moved to DLX after ${maxRetries} retries`);
                        }
                    }
                },
                { noAck: false, ...options }
            );

            console.log(`👂 Listening to queue "${queue}" (max retries: ${maxRetries})`);
        } catch (error) {
            console.error(`❌ Failed to consume messages from "${queue}":`, error);
            throw error;
        }
    }

    private async retryMessage(queue: string, msg: ConsumeMessage, retryCount: number): Promise<void> {
        const channel = await this.getChannel(queue);
        // Gửi message vào retry exchange với retry count tăng lên
        channel.publish(
            this.RETRY_EXCHANGE,
            queue, // routing key
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

                } catch (error) {
                    console.error(`❌ Error processing DLX message:`, error);
                    channel.nack(msg, false, false);
                }
            }
        );
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