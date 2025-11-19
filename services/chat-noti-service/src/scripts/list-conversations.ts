import mongoose from "mongoose";
import { config } from "../config/environment";
import { Conversation } from "../models";
import { logger } from "../utils/logger";

/**
 * Script to list all conversations with their IDs
 * Useful for testing the socket client
 */
const listConversations = async (): Promise<void> => {
	try {
		logger.info("Fetching conversations...");

		// Connect to MongoDB
		await mongoose.connect(config.mongodb.uri);
		logger.info("Connected to MongoDB\n");

		// Get all conversations
		const conversations = await Conversation.find()
			.populate("lastMessage")
			.sort({ lastMessageAt: -1 });

		if (conversations.length === 0) {
			logger.info(
				"❌ No conversations found. Run 'npm run seed' to create sample data."
			);
		} else {
			logger.info(`📋 Found ${conversations.length} conversation(s):\n`);

			conversations.forEach((conv, index) => {
				console.log(`${index + 1}. Conversation ID: ${conv._id}`);
				console.log(`   Participants:`);
				conv.participants.forEach((p) => {
					console.log(`   - ${p.id} (${p.type})`);
				});
				console.log(`   Unread counts:`);
				conv.unreadCount.forEach((count, participantId) => {
					console.log(`   - ${participantId}: ${count}`);
				});
				console.log(
					`   Last message: ${conv.lastMessageAt || "None"}\n`
				);
			});

			logger.info("\n💡 Copy a Conversation ID above to use in the socket client");
			logger.info("   Make sure your userId matches one of the participants!");
		}

		await mongoose.connection.close();
		logger.info("\n✓ Database connection closed");
	} catch (error) {
		logger.error("Error listing conversations:", error);
		process.exit(1);
	}
};

// Run the script
listConversations();
