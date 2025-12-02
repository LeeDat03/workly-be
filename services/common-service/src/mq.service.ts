import mqManager from "./mq.adapter";
export const QUEUES = {
    EMAIL: "email_queue",
} as const;

export type QueueName = typeof QUEUES[keyof typeof QUEUES];
// ============================================
// EMAIL HANDLER (Main)
// ============================================

const handleEmail = async (message: string): Promise<void> => {
    console.log("📧 Processing email:");
    try {
        // TODO: Thay bằng logic gửi email thật
        // await emailService.send(message);
        console.log("hehe", message);

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));


        if (true) {
            throw new Error("Email service temporarily unavailable");
        }

        console.log("✅ Email sent successfully");
    } catch (error) {
        console.error("❌ Email sending failed:", error);
        throw error; // Trigger retry mechanism
    }
};

// ============================================
// EMAIL DLX HANDLER (Failed Messages)
// ============================================

const handleEmailDLX = async (message: string): Promise<void> => {
    console.log("💀 Handling FAILED email (DLX):");
    console.log("hehe", message);
    // TODO: Xử lý email failed sau khi retry hết
    // - Gửi alert cho admin
    // - Log vào database
    // - Gửi vào monitoring system (Sentry, Datadog, etc.)
    // - Lưu vào bảng failed_emails để review sau

    console.log("📧 Admin alert sent about failed email");
    console.log("💾 Failed email logged to database");
};

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

export async function setupAllConsumers(): Promise<void> {
    try {
        await setupEmailConsumer();
        await setupEmailDLXConsumer();
    } catch (error) {
        console.error("❌ Failed to setup consumers:", error);
        throw error;
    }
}