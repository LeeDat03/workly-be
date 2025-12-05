import mqManager from "@/common/infrastructure/mq.adapter";
import { ObjectId } from "mongodb";

// ============================================
// QUEUE NAME
// ============================================

export const QUEUES = {
    EMAIL: "email_queue",
    POST: "post_queue",
    UC_JOB: "uc_job_queue", // for create/update jobs node in user company service
} as const;

export interface PostEvent {
    type: string;
    postId: ObjectId;
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
export async function sendEventAddPost(data: PostEvent) {
    try {
        await mqManager.sendToQueue(QUEUES.POST, data);
    } catch (error) {
        console.error("❌ Failed to queue post:", error);
        throw error;
    }
}

export async function sendJobToUCQueue(message: {
    jobId: string;
    companyId: string;
    skills?: string[];
    action: "created" | "updated" | "deleted";
    endDate?: string;
}): Promise<void> {
    try {
        await mqManager.sendToQueue(QUEUES.UC_JOB, message);
    } catch (error) {
        console.error("❌ Failed to send job message to UC queue:", error);
        throw error;
    }
}