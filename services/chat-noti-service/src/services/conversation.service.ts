import { Conversation, IConversation, Message } from "../models";
import { ApiError } from "../utils";
import { ParticipantType, IParticipant } from "../types";

export class ConversationService {
	/**
	 * Tạo hoặc lấy conversation giữa 2 participants
	 */
	async createOrGetConversation(
		participant1: IParticipant,
		participant2: IParticipant
	): Promise<IConversation> {
		// Kiểm tra xem conversation đã tồn tại chưa
		let conversation = await Conversation.findByParticipants(
			participant1,
			participant2
		);

		if (!conversation) {
			// Tạo conversation mới
			conversation = await Conversation.create({
				participants: [participant1, participant2],
				unreadCount: new Map([
					[participant1.id, 0],
					[participant2.id, 0],
				]),
			});
		}

		return conversation;
	}

	/**
	 * Lấy tất cả conversations của một participant
	 */
	async getConversationsByParticipant(
		participantId: string,
		participantType: ParticipantType,
		page: number = 1,
		limit: number = 20
	): Promise<{
		conversations: IConversation[];
		total: number;
		page: number;
		limit: number;
	}> {
		const conversations = await Conversation.findByParticipant(
			participantId,
			participantType,
			page,
			limit
		);

		const total = await Conversation.countDocuments({
			"participants.id": participantId,
			"participants.type": participantType,
		});

		return {
			conversations,
			total,
			page,
			limit,
		};
	}

	/**
	 * Lấy conversation theo ID
	 */
	async getConversationById(
		conversationId: string,
		userId: string
	): Promise<IConversation> {
		const conversation = await Conversation.findById(
			conversationId
		).populate("lastMessage");

		if (!conversation) {
			throw ApiError.notFound("Conversation not found");
		}

		// Kiểm tra xem user có phải là participant không
		const isParticipant = conversation.participants.some(
			(p) => p.id === userId
		);

		if (!isParticipant) {
			throw ApiError.forbidden(
				"You are not a participant of this conversation"
			);
		}

		return conversation;
	}

	/**
	 * Xóa conversation
	 */
	async deleteConversation(
		conversationId: string,
		userId: string
	): Promise<void> {
		const conversation = await Conversation.findById(conversationId);

		if (!conversation) {
			throw ApiError.notFound("Conversation not found");
		}

		// Kiểm tra xem user có phải là participant không
		const isParticipant = conversation.participants.some(
			(p) => p.id === userId
		);

		if (!isParticipant) {
			throw ApiError.forbidden(
				"You are not a participant of this conversation"
			);
		}

		// Xóa tất cả messages của conversation
		await Message.deleteMany({ conversationId });

		// Xóa conversation
		await Conversation.findByIdAndDelete(conversationId);
	}

	/**
	 * Update unread count cho conversation
	 */
	async updateUnreadCount(
		conversationId: string,
		participantId: string,
		increment: boolean = true
	): Promise<void> {
		const conversation = await Conversation.findById(conversationId);

		if (!conversation) {
			throw ApiError.notFound("Conversation not found");
		}

		const currentCount = conversation.unreadCount.get(participantId) || 0;
		const newCount = increment ? currentCount + 1 : 0;

		conversation.unreadCount.set(participantId, newCount);
		await conversation.save();
	}

	/**
	 * Reset unread count về 0
	 */
	async resetUnreadCount(
		conversationId: string,
		participantId: string
	): Promise<void> {
		await this.updateUnreadCount(conversationId, participantId, false);
	}
}
