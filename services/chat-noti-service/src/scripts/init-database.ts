import mongoose from "mongoose";
import { config } from "../config/environment";
import { logger } from "../utils/logger";

/**
 * Script để khởi tạo database, collections và indexes
 * Run: npm run init-db
 */
const initializeDatabase = async (): Promise<void> => {
	try {
		logger.info("Starting database initialization...");

		// Connect to MongoDB
		await mongoose.connect(config.mongodb.uri);
		logger.info(`Connected to MongoDB: ${config.mongodb.uri}`);

		const db = mongoose.connection.db;

		if (!db) {
			throw new Error("Database connection not established");
		}

		// Lấy danh sách collections hiện có
		const collections = await db.listCollections().toArray();
		const collectionNames = collections.map((c) => c.name);

		logger.info(`Current collections: ${collectionNames.join(", ") || "none"}`);

		// Tạo collection 'conversations' nếu chưa có
		if (!collectionNames.includes("conversations")) {
			await db.createCollection("conversations", {
				validator: {
					$jsonSchema: {
						bsonType: "object",
						required: ["participants"],
						properties: {
							participants: {
								bsonType: "array",
								minItems: 2,
								maxItems: 2,
								description: "Must have exactly 2 participants",
							},
						},
					},
				},
			});
			logger.info("✓ Created 'conversations' collection with validation");
		} else {
			logger.info("✓ Collection 'conversations' already exists");
		}

		// Tạo collection 'messages' nếu chưa có
		if (!collectionNames.includes("messages")) {
			await db.createCollection("messages", {
				validator: {
					$jsonSchema: {
						bsonType: "object",
						required: ["conversationId", "sender", "content"],
						properties: {
							conversationId: {
								bsonType: "objectId",
								description: "Must be a valid conversation ID",
							},
							sender: {
								bsonType: "object",
								required: ["id", "type"],
							},
							content: {
								bsonType: "string",
								minLength: 1,
								description: "Message content cannot be empty",
							},
						},
					},
				},
			});
			logger.info("✓ Created 'messages' collection with validation");
		} else {
			logger.info("✓ Collection 'messages' already exists");
		}

		// Tạo indexes cho conversations
		logger.info("Creating indexes for 'conversations' collection...");
		const conversationsCollection = db.collection("conversations");
		
		await conversationsCollection.createIndex(
			{ "participants.id": 1 },
			{ name: "participants_id_index" }
		);
		
		await conversationsCollection.createIndex(
			{ lastMessageAt: -1 },
			{ name: "last_message_at_index" }
		);
		
		logger.info("✓ Created indexes for 'conversations' collection");

		// Tạo indexes cho messages
		logger.info("Creating indexes for 'messages' collection...");
		const messagesCollection = db.collection("messages");
		
		await messagesCollection.createIndex(
			{ conversationId: 1, createdAt: -1 },
			{ name: "conversation_messages_index" }
		);
		
		await messagesCollection.createIndex(
			{ conversationId: 1, "readBy.participantId": 1 },
			{ name: "conversation_read_messages_index" }
		);
		
		await messagesCollection.createIndex(
			{ "sender.id": 1 },
			{ name: "sender_index" }
		);
		
		logger.info("✓ Created indexes for 'messages' collection");

		// List all indexes
		const conversationIndexes = await conversationsCollection.indexes();
		const messageIndexes = await messagesCollection.indexes();

		logger.info(`
Database initialization completed successfully!

Conversations Collection Indexes:
${conversationIndexes.map((idx) => `  - ${idx.name}`).join("\n")}

Messages Collection Indexes:
${messageIndexes.map((idx) => `  - ${idx.name}`).join("\n")}
		`);

		await mongoose.connection.close();
		logger.info("Database connection closed");
		process.exit(0);
	} catch (error) {
		logger.error("Error initializing database:", error);
		await mongoose.connection.close();
		process.exit(1);
	}
};

// Run initialization
initializeDatabase();

