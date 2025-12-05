import mqManager from "@/common/infrastructure/mq.adapter";
import { ObjectId } from "mongodb";
import { handleEmail, handleEmailDLX, handleJob, handleJobDLX, handlePost, handlePostDLX } from "./handler.service";

// ============================================
// QUEUE NAME
// ============================================

export const QUEUES = {
    EMAIL: "email_queue",
    POST: "post_queue",
    JOB: "job_queue",
    UC_JOB: "uc_job_queue", // for create/update jobs node in user company service
} as const;

export interface BaseEvent {
    type: string;
    id: ObjectId | string;
}

export type QueueName = typeof QUEUES[keyof typeof QUEUES];

export async function sendToEmailQueue(data: string): Promise<void> {
    try {
        await mqManager.sendToQueue(QUEUES.EMAIL, { hehe: "dang test" });
    } catch (error) {
        console.error("❌ Failed to queue email:", error);
        throw error;
    }
}
export async function sendEventPost(data: BaseEvent) {
    try {
        await mqManager.sendToQueue(QUEUES.POST, data);
    } catch (error) {
        console.error("❌ Failed to queue post:", error);
        throw error;
    }
}
export async function sendEventJob(data: BaseEvent) {
    try {
        await mqManager.sendToQueue(QUEUES.JOB, data);
    } catch (error) {
        console.error("❌ Failed to queue post:", error);
        throw error;
    }
}




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
    try {
        console.log("📋 Registering email queue...");


        await mqManager.assertQueue(QUEUES.EMAIL, {
            durable: true,
            maxRetries: 3,          // Retry 3 lần
            retryDelay: 5000,       // Đợi 5 giây giữa mỗi lần retry
            enableDLX: true,        // Bật DLX cho failed messages
        });

        await mqManager.assertQueue(QUEUES.POST, {
            durable: true,
            maxRetries: 5,          // Retry 3 lần
            retryDelay: 10000,       // Đợi 5 giây giữa mỗi lần retry
            enableDLX: true,        // Bật DLX cho failed messages
        });

        await mqManager.assertQueue(QUEUES.JOB, {
            durable: true,
            maxRetries: 5,          // Retry 3 lần
            retryDelay: 10000,       // Đợi 5 giây giữa mỗi lần retry
            enableDLX: true,        // Bật DLX cho failed messages
        });


        console.log("✅ All queue registered successfully");
    } catch (error) {
        console.error("❌ Failed to register email queue:", error);
        throw error;
    }
}

// ============================================
// EMAIL DLX HANDLER (Failed Messages)
// ============================================


// ============================================
// SETUP CONSUMERS
// ============================================

export async function setupEmailConsumer(): Promise<void> {
    try {
        console.log("👂 Setting up email consumer...");
        await mqManager.consume(QUEUES.EMAIL, handleEmail, {
            maxRetries: 3,
        });
        console.log("✅ Email consumer started (with 3 retries)");
    } catch (error) {
        console.error("❌ Failed to setup email consumer:", error);
        throw error;
    }
}

export async function setupEmailDLXConsumer(): Promise<void> {
    try {
        console.log("💀 Setting up email DLX consumer...");
        await mqManager.consumeDLX(QUEUES.EMAIL, handleEmailDLX);
        console.log("✅ Email DLX consumer started");
    } catch (error) {
        console.error("❌ Failed to setup email DLX consumer:", error);
        throw error;
    }
}


export async function setupPostConsumer(): Promise<void> {
    try {
        console.log("👂 Setting up post consumer...");
        await mqManager.consume(QUEUES.POST, handlePost, {
            maxRetries: 5,
        });
        console.log("✅ post consumer started (with 5 retries)");
    } catch (error) {
        console.error("❌ Failed to setup post consumer:", error);
        throw error;
    }
}

export async function setupPostDLXConsumer(): Promise<void> {
    try {
        console.log("💀 Setting up post DLX consumer...");
        await mqManager.consumeDLX(QUEUES.EMAIL, handlePostDLX);
        console.log("✅ Email DLX consumer started");
    } catch (error) {
        console.error("❌ Failed to setup post DLX consumer:", error);
        throw error;
    }
}

export async function setupJobConsumer(): Promise<void> {
    try {
        console.log("👂 Setting up post consumer...");
        await mqManager.consume(QUEUES.JOB, handleJob, {
            maxRetries: 5,
        });
        console.log("✅ post consumer started (with 5 retries)");
    } catch (error) {
        console.error("❌ Failed to setup post consumer:", error);
        throw error;
    }
}

export async function setupJobDLXConsumer(): Promise<void> {
    try {
        console.log("💀 Setting up post DLX consumer...");
        await mqManager.consumeDLX(QUEUES.JOB, handleJobDLX);
        console.log("✅ Email DLX consumer started");
    } catch (error) {
        console.error("❌ Failed to setup post DLX consumer:", error);
        throw error;
    }
}

export async function setupAllConsumers(): Promise<void> {
    try {
        await setupEmailConsumer();
        await setupEmailDLXConsumer();
        await setupPostConsumer();
        await setupPostDLXConsumer();
        await setupJobConsumer();
        await setupJobDLXConsumer();
    } catch (error) {
        console.error("❌ Failed to setup consumers:", error);
    }
}
export async function sendJobToUCQueue(message: {
    jobId: string;
    companyId: string;
    skills?: string[];
    action: "created" | "updated" | "deleted";
    timestamp: string;
}): Promise<void> {
    try {
        await mqManager.sendToQueue(QUEUES.UC_JOB, message);
    } catch (error) {
        console.error("❌ Failed to send job message to UC queue:", error);
        throw error;
    }
}

