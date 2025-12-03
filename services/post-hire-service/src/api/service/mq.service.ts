import mqManager from "@/common/infrastructure/mq.adapter";
import { ObjectId } from "mongodb";

// ============================================
// QUEUE NAME
// ============================================

export const QUEUES = {
    EMAIL: "email_queue",
    POST: "post_queue",
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