import { Message, IMessage, Conversation } from "../models";
import { ApiError } from "../utils";
import { IParticipant } from "../types";
import { ConversationService } from "./conversation.service";

export class MessageService {
	private conversationService: ConversationService;

	constructor() {
		this.conversationService = new ConversationService();
	}

	/**
	 * Gửi message
	 */
	async sendMessage(
		conversationId: string,
		sender: IParticipant,
		content: string
	): Promise<IMessage> {
		// Kiểm tra conversation tồn tại
		const conversation = await Conversation.findById(conversationId);

		if (!conversation) {
			throw ApiError.notFound("Conversation not found");
		}

		// Kiểm tra sender có phải là participant không
		const isParticipant = conversation.participants.some(
			(p) => p.id === sender.id && p.type === sender.type
		);

		if (!isParticipant) {
			throw ApiError.forbidden(
				"You are not a participant of this conversation"
			);
		}
		const message = await Message.create({
			conversationId,
			sender,
			content,
		});
		conversation.lastMessage = message._id as any;
		conversation.lastMessageAt = new Date();
		const receiver = conversation.participants.find(
			(p) => p.id !== sender.id || p.type !== sender.type
		);

		if (receiver) {
			await this.conversationService.updateUnreadCount(
				conversationId,
				receiver.id,
				true
			);
		}

		await conversation.save();

		return message;
	}

	/**
	 * Lấy messages của một conversation
	 */
	async getMessagesByConversation(
		conversationId: string,
		userId: string,
		page: number = 1,
		limit: number = 50
	): Promise<{
		messages: IMessage[];
		total: number;
		page: number;
		limit: number;
	}> {
		// Kiểm tra user có quyền xem conversation không
		const conversation = await Conversation.findById(conversationId);

		if (!conversation) {
			throw ApiError.notFound("Conversation not found");
		}

		const isParticipant = conversation.participants.some(
			(p) => p.id === userId
		);

		if (!isParticipant) {
			throw ApiError.forbidden(
				"You are not a participant of this conversation"
			);
		}

		// Lấy messages
		const messages = await Message.findByConversation(
			conversationId,
			page,
			limit
		);

		const total = await Message.countDocuments({ conversationId });

		return {
			messages: messages.reverse(), // Reverse để có thứ tự từ cũ đến mới
			total,
			page,
			limit,
		};
	}

	/**
	 * Đánh dấu message đã đọc
	 */
	async markMessageAsRead(
		messageId: string,
		userId: string
	): Promise<IMessage> {
		const message = await Message.findById(messageId);

		if (!message) {
			throw ApiError.notFound("Message not found");
		}

		// Kiểm tra user có phải là participant không
		const conversation = await Conversation.findById(
			message.conversationId
		);

		if (!conversation) {
			throw ApiError.notFound("Conversation not found");
		}

		const isParticipant = conversation.participants.some(
			(p) => p.id === userId
		);

		if (!isParticipant) {
			throw ApiError.forbidden(
				"You are not a participant of this conversation"
			);
		}

		// Không thể đánh dấu message của chính mình
		if (message.sender.id === userId) {
			throw ApiError.badRequest("Cannot mark your own message as read");
		}

		await message.markAsRead(userId);

		// Giảm unread count
		await this.conversationService.updateUnreadCount(
			message.conversationId.toString(),
			userId,
			false
		);

		return message;
	}

	/**
	 * Đánh dấu tất cả messages trong conversation đã đọc
	 */
	async markAllMessagesAsRead(
		conversationId: string,
		userId: string
	): Promise<void> {
		// Kiểm tra user có quyền không
		const conversation = await Conversation.findById(conversationId);

		if (!conversation) {
			throw ApiError.notFound("Conversation not found");
		}

		const isParticipant = conversation.participants.some(
			(p) => p.id === userId
		);

		if (!isParticipant) {
			throw ApiError.forbidden(
				"You are not a participant of this conversation"
			);
		}

		// Lấy tất cả unread messages (không phải của user)
		const unreadMessages = await Message.find({
			conversationId,
			"sender.id": { $ne: userId },
			"readBy.participantId": { $ne: userId },
		});

		// Đánh dấu từng message
		for (const message of unreadMessages) {
			await message.markAsRead(userId);
		}

		// Reset unread count
		await this.conversationService.resetUnreadCount(conversationId, userId);
	}

	/**
	 * Lấy message theo ID
	 */
	async getMessageById(messageId: string): Promise<IMessage> {
		const message = await Message.findById(messageId);

		if (!message) {
			throw ApiError.notFound("Message not found");
		}

		return message;
	}
}
