import app from "./app";
import { config } from "./config";
import { database } from "./config/database";
import { closeQueues } from "./infrastructure/queue/setup";
import { initModels } from "./models";
import logger from "./utils/logger";

const startServer = async () => {
	try {
		await database.connect();
		await initModels(database.getNeogma());

		const server = app.listen(config.port, () => {
			logger.info(`Server started on http://localhost:${config.port}`);
		});

		const gracefulShutdown = async (signal: string) => {
			logger.info(`${signal} received. Closing server gracefully...`);
			server.close(async () => {
				await closeQueues();
				await database.disconnect();
				process.exit(0);
			});

			setTimeout(() => {
				logger.error(
					"Could not close connections in time, forcefully shutting down",
				);
				process.exit(1);
			}, 10000);
		};

		process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
		process.on("SIGINT", () => gracefulShutdown("SIGINT"));
		process.on("unhandledRejection", (reason: Error) => {
			logger.error("Unhandled Rejection:", reason);
			throw reason;
		});

		process.on("uncaughtException", (error: Error) => {
			logger.error("Uncaught Exception:", error);
			process.exit(1);
		});
	} catch (error) {
		console.log("error");
		logger.error("Failed to start server:", error);
		process.exit(1);
	}
};

startServer();
