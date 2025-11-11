import { App } from "./app";
import { config, connectDatabase } from "./config";
import { ChatSocket } from "./socket";
import { logger } from "./utils";

const startServer = async (): Promise<void> => {
	try {
		// Connect to database
		await connectDatabase();

		// Initialize app
		const appInstance = new App();
		const server = appInstance.getServer();
		const io = appInstance.getSocketIO();

		// Initialize socket handlers
		new ChatSocket(io);

		// Start server
		server.listen(config.port, () => {
			logger.info(`
      ╔═══════════════════════════════════════════════════════╗
      ║                                                       ║
      ║   🚀 Chat Service is running!                        ║
      ║                                                       ║
      ║   Environment: ${config.nodeEnv.padEnd(37)}║
      ║   Port:        ${config.port.toString().padEnd(37)}║
      ║   MongoDB:     Connected                             ║
      ║   Socket.IO:   Enabled                               ║
      ║                                                       ║
      ║   API:         http://localhost:${config.port}/api             ║
      ║   Health:      http://localhost:${config.port}/api/health      ║
      ║                                                       ║
      ╚═══════════════════════════════════════════════════════╝
      `);
		});

		// Handle unhandled promise rejections
		process.on("unhandledRejection", (reason: Error) => {
			logger.error("Unhandled Rejection:", reason);
			// Close server & exit process
			server.close(() => process.exit(1));
		});

		// Handle uncaught exceptions
		process.on("uncaughtException", (error: Error) => {
			logger.error("Uncaught Exception:", error);
			// Close server & exit process
			server.close(() => process.exit(1));
		});
	} catch (error) {
		logger.error("Failed to start server:", error);
		process.exit(1);
	}
};

// Start the server
startServer();
