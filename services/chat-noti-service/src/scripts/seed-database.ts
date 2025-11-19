import mongoose from "mongoose";
import { config } from "../config/environment";
import { Conversation, Message } from "../models";
import { ParticipantType, MessageStatus } from "../types";
import { logger } from "../utils/logger";

/**
 * Seed database với dữ liệu mẫu để test
 */
const seedDatabase = async (): Promise<void> => {
	try {
		logger.info("Starting database seeding...");

		// Connect to MongoDB
		await mongoose.connect(config.mongodb.uri);
		logger.info("Connected to MongoDB");

		// Xóa dữ liệu cũ (chỉ để test)
		await Conversation.deleteMany({});
		await Message.deleteMany({});
		logger.info("Cleared existing data");

		// Tạo conversations mẫu
		const conversation1 = await Conversation.create({
			participants: [
				{ id: "user123", type: ParticipantType.USER },
				{ id: "user456", type: ParticipantType.USER },
			],
			unreadCount: new Map([
				["user123", 0],
				["user456", 0],
			]),
		});

		const conversation2 = await Conversation.create({
			participants: [
				{ id: "user123", type: ParticipantType.USER },
				{ id: "company789", type: ParticipantType.COMPANY },
			],
			unreadCount: new Map([
				["user123", 0],
				["company789", 0],
			]),
		});

		logger.info("✓ Created sample conversations");

		// Tạo messages mẫu cho conversation 1
		const message1 = await Message.create({
			conversationId: conversation1._id,
			sender: { id: "user123", type: ParticipantType.USER },
			content: "Hello! How are you?",
			status: MessageStatus.READ,
			readBy: [
				{
					participantId: "user456",
					readAt: new Date(),
				},
			],
		});

		const message2 = await Message.create({
			conversationId: conversation1._id,
			sender: { id: "user456", type: ParticipantType.USER },
			content: "Hi! I'm doing great, thanks for asking!",
			status: MessageStatus.READ,
			readBy: [
				{
					participantId: "user123",
					readAt: new Date(),
				},
			],
		});

		const message3 = await Message.create({
			conversationId: conversation1._id,
			sender: { id: "user123", type: ParticipantType.USER },
			content: "That's wonderful to hear!",
			status: MessageStatus.SENT,
			readBy: [],
		});

		// Update conversation 1 với last message
		conversation1.lastMessage = message3._id as any;
		conversation1.lastMessageAt = message3.createdAt;
		conversation1.unreadCount.set("user456", 1);
		await conversation1.save();

		logger.info("✓ Created sample messages for conversation 1");

		// Tạo messages mẫu cho conversation 2
		const message4 = await Message.create({
			conversationId: conversation2._id,
			sender: { id: "company789", type: ParticipantType.COMPANY },
			content: "Thank you for your application!",
			status: MessageStatus.READ,
			readBy: [
				{
					participantId: "user123",
					readAt: new Date(),
				},
			],
		});

		const message5 = await Message.create({
			conversationId: conversation2._id,
			sender: { id: "user123", type: ParticipantType.USER },
			content: "Thank you! Looking forward to hearing from you.",
			status: MessageStatus.SENT,
			readBy: [],
		});

		// Update conversation 2 với last message
		conversation2.lastMessage = message5._id as any;
		conversation2.lastMessageAt = message5.createdAt;
		conversation2.unreadCount.set("company789", 1);
		await conversation2.save();

		logger.info("✓ Created sample messages for conversation 2");

		logger.info("✅ Database seeding completed successfully!");
		logger.info(`
Summary:
- ${await Conversation.countDocuments()} conversations created
- ${await Message.countDocuments()} messages created
		`);

		await mongoose.connection.close();
		process.exit(0);
	} catch (error) {
		logger.error("Error seeding database:", error);
		await mongoose.connection.close();
		process.exit(1);
	}
};

// Run seed
seedDatabase();
