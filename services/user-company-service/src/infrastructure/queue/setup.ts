import { logger } from "../../utils";
import { handleUCJobTask, handleUCJobTaskDLX } from "./tasks/handleUCJobTask";
import mqManager from "./mq.adapter";
import { QUEUES } from "./type";

// ============================================
// QUEUE REGISTRATION
// ============================================
export async function registerAllQueues(): Promise<void> {
	try {
		logger.info("📋 Registering all queues...");

		await mqManager.connect();
		await mqManager.assertQueue(QUEUES.UC_JOB, {
			durable: true,
			enableDLX: true,
		});

		logger.info("✅ All queues registered successfully");
	} catch (error) {
		logger.error("❌ Failed to register queues:", error);
		throw error;
	}
}

// ============================================
// QUEUE CONSUMERS
// ============================================
export async function startConsumingQueues(): Promise<void> {
	try {
		logger.info("👂 Starting queue consumers...");

		// Start consuming from UC_JOB queue
		await mqManager.consume(QUEUES.UC_JOB, handleUCJobTask, {
			maxRetries: 3,
			retryDelay: 5000,
		});
		await mqManager.consumeDLX(QUEUES.UC_JOB, handleUCJobTaskDLX);

		logger.info("✅ All queue consumers started successfully");
	} catch (error) {
		logger.error("❌ Failed to start queue consumers:", error);
		throw error;
	}
}

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
export async function closeQueues(): Promise<void> {
	try {
		await mqManager.close();
		logger.info("✅ RabbitMQ connections closed gracefully");
	} catch (error) {
		logger.error("❌ Error closing RabbitMQ:", error);
		throw error;
	}
}
