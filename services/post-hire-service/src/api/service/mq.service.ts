import mqManager from "@/common/infrastructure/mq.adapter";

// ============================================
// QUEUE NAME
// ============================================

export const QUEUES = {
    EMAIL: "email_queue",
} as const;

export type QueueName = typeof QUEUES[keyof typeof QUEUES];

// ============================================
// MESSAGE TYPE
// ============================================

export interface EmailMessage {
    to: string | string[];
    subject: string;
    body: string;
    attachments?: string[];
    cc?: string[];
    bcc?: string[];
}

// ============================================
// REGISTER QUEUE
// ============================================
export async function registerAllQueue(): Promise<void> {
    await registerEmailQueue();
}

export async function registerEmailQueue(): Promise<void> {
    try {
        console.log("📋 Registering email queue...");

        await mqManager.connect();

        // Setup email queue với retry và DLX
        await mqManager.assertQueue(QUEUES.EMAIL, {
            durable: true,
            maxRetries: 3,          // Retry 3 lần
            retryDelay: 5000,       // Đợi 5 giây giữa mỗi lần retry
            enableDLX: true,        // Bật DLX cho failed messages
        });

        console.log("✅ Email queue registered successfully");
    } catch (error) {
        console.error("❌ Failed to register email queue:", error);
        throw error;
    }
}


export async function sendToEmailQueue(data: string): Promise<void> {
    try {
        await mqManager.sendToQueue(QUEUES.EMAIL, { hehe: "dang test" });
    } catch (error) {
        console.error("❌ Failed to queue email:", error);
        throw error;
    }
}