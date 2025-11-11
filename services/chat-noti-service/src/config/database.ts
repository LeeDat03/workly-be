import mongoose from "mongoose";
import { config } from "./environment";
import { logger } from "../utils/logger";

/**
 * Khởi tạo database: tạo collections và indexes
 */
const initializeDatabase = async (): Promise<void> => {
	try {
		const db = mongoose.connection.db;

		if (!db) {
			throw new Error("Database connection not established");
		}

		logger.info("Initializing database...");

		// Lấy danh sách collections hiện có
		const collections = await db.listCollections().toArray();
		const collectionNames = collections.map((c) => c.name);

		// Tạo collection 'conversations' nếu chưa có
		if (!collectionNames.includes("conversations")) {
			await db.createCollection("conversations");
			logger.info("✓ Created 'conversations' collection");
		} else {
			logger.info("✓ Collection 'conversations' already exists");
		}

		// Tạo collection 'messages' nếu chưa có
		if (!collectionNames.includes("messages")) {
			await db.createCollection("messages");
			logger.info("✓ Created 'messages' collection");
		} else {
			logger.info("✓ Collection 'messages' already exists");
		}

		// Tạo indexes cho conversations
		const conversationsCollection = db.collection("conversations");
		await conversationsCollection.createIndex({ "participants.id": 1 });
		await conversationsCollection.createIndex({ lastMessageAt: -1 });
		logger.info("✓ Created indexes for 'conversations' collection");

		// Tạo indexes cho messages
		const messagesCollection = db.collection("messages");
		await messagesCollection.createIndex({
			conversationId: 1,
			createdAt: -1,
		});
		await messagesCollection.createIndex({
			conversationId: 1,
			"readBy.participantId": 1,
		});
		logger.info("✓ Created indexes for 'messages' collection");

		logger.info("✅ Database initialization completed successfully");
	} catch (error) {
		logger.error("Error initializing database:", error);
		throw error;
	}
};

export const connectDatabase = async (): Promise<void> => {
	try {
		// Connect to MongoDB
		const connection = await mongoose.connect(config.mongodb.uri);

		logger.info(`MongoDB Connected: ${connection.connection.host}`);

		// Khởi tạo database (tạo collections và indexes)
		await initializeDatabase();

		// Xử lý các sự kiện kết nối
		mongoose.connection.on("error", (error) => {
			logger.error("MongoDB connection error:", error);
		});

		mongoose.connection.on("disconnected", () => {
			logger.warn("MongoDB disconnected");
		});

		mongoose.connection.on("reconnected", () => {
			logger.info("MongoDB reconnected");
		});

		// Graceful shutdown
		process.on("SIGINT", async () => {
			await mongoose.connection.close();
			logger.info("MongoDB connection closed through app termination");
			process.exit(0);
		});

		process.on("SIGTERM", async () => {
			await mongoose.connection.close();
			logger.info("MongoDB connection closed through app termination");
			process.exit(0);
		});
	} catch (error) {
		logger.error("Error connecting to MongoDB:", error);
		process.exit(1);
	}
};
