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
	 * Logic:
	 * - Nếu một trong hai participant đã bị xóa account → Hard delete (xóa vĩnh viễn)
	 * - Nếu cả hai participant đều bị xóa → Hard delete (xóa vĩnh viễn)
	 * - Nếu cả hai đều còn tồn tại → Frontend sẽ xử lý soft delete (ẩn ở client)
	 */
	async deleteConversation(
		conversationId: string,
		userId: string,
		hasDeletedParticipantFromRequest?: boolean
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

		// Kiểm tra xem có participant nào đã bị xóa không
		// Ưu tiên sử dụng thông tin từ frontend request, nếu không có thì check trong DB
		const deletedParticipantsMap =
			conversation.deletedParticipants || new Map();
		const deletedParticipantsArray = Array.from(
			deletedParticipantsMap.entries()
		);

		const hasDeletedParticipantInDB = conversation.participants.some((p) =>
			deletedParticipantsMap.has(p.id)
		);

		// Sử dụng thông tin từ request body nếu có, nếu không thì dùng thông tin từ DB
		const hasDeletedParticipant =
			hasDeletedParticipantFromRequest !== undefined
				? hasDeletedParticipantFromRequest
				: hasDeletedParticipantInDB;

		// TRƯỜNG HỢP 1: Có ít nhất một participant đã bị xóa → HARD DELETE
		if (hasDeletedParticipant) {
			// Xóa tất cả messages của conversation
			await Message.deleteMany({ conversationId });

			// Xóa conversation
			await Conversation.findByIdAndDelete(conversationId);
			return;
		}

		// TRƯỜNG HỢP 2: Cả hai đều còn tồn tại → Backend không làm gì
		// Frontend sẽ xử lý soft delete (ẩn ở client)

		// Nếu cả hai đều còn tồn tại, frontend sẽ xử lý soft delete
		// Backend không làm gì, chỉ trả về success
		// Frontend sẽ tự xử lý ẩn ở client-side
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

	/**
	 * Đánh dấu participant đã bị xóa
	 * Sau khi đánh dấu, kiểm tra và xóa conversations nếu cả hai participant đều bị xóa
	 */
	async markParticipantAsDeleted(
		participantId: string,
		participantType: ParticipantType
	): Promise<void> {
		// Tìm tất cả conversations có participant này
		const conversations = await Conversation.find({
			participants: {
				$elemMatch: {
					id: participantId,
					type: participantType,
				},
			},
		});

		// Đánh dấu participant là deleted trong tất cả conversations
		const updatePromises = conversations.map(async (conversation) => {
			conversation.deletedParticipants.set(participantId, new Date());
			return await conversation.save();
		});

		await Promise.all(updatePromises);

		// Sau khi đánh dấu, kiểm tra và xóa conversations nếu cả hai đều bị xóa
		await this.cleanupDeletedConversations();
	}

	/**
	 * Xóa các conversations mà cả hai participant đều đã bị xóa
	 * TRƯỜNG HỢP 3: Tự động cleanup khi cả hai đều bị xóa
	 */
	async cleanupDeletedConversations(): Promise<void> {
		// Lấy tất cả conversations (vì Map không query được trực tiếp trong MongoDB)
		const allConversations = await Conversation.find({});

		// Kiểm tra từng conversation
		for (const conversation of allConversations) {
			// Bỏ qua nếu không có deleted participants
			if (
				!conversation.deletedParticipants ||
				conversation.deletedParticipants.size === 0
			) {
				continue;
			}

			// Kiểm tra xem cả hai participant đều bị xóa không
			const allParticipantsDeleted = conversation.participants.every(
				(p) => conversation.deletedParticipants?.has(p.id)
			);

			if (allParticipantsDeleted) {
				// Cả hai đều bị xóa → HARD DELETE
				await Message.deleteMany({ conversationId: conversation._id });
				await Conversation.findByIdAndDelete(conversation._id);
			}
		}
	}
}
