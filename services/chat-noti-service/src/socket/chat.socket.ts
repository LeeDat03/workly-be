import { Server, Socket } from "socket.io";
import { MessageService, ConversationService } from "../services";
import { logger } from "../utils";
import {
	ISocketData,
	ITypingData,
	IMessageReadData,
	ParticipantType,
} from "../types";

export class ChatSocket {
	private io: Server;
	private messageService: MessageService;
	private conversationService: ConversationService;

	// Map để track users online và rooms họ đang ở
	private onlineUsers: Map<string, string> = new Map(); // userId -> socketId
	private userRooms: Map<string, Set<string>> = new Map(); // socketId -> Set of conversationIds

	constructor(io: Server) {
		this.io = io;
		this.messageService = new MessageService();
		this.conversationService = new ConversationService();
		this.initializeSocketHandlers();
	}

	private initializeSocketHandlers(): void {
		this.io.on("connection", (socket: Socket) => {
			logger.info(`Client connected: ${socket.id}`);

			// Authenticate socket connection
			this.handleAuthentication(socket);

			// Join conversation room
			socket.on("join_conversation", (data) =>
				this.handleJoinConversation(socket, data)
			);

			// Leave conversation room
			socket.on("leave_conversation", (data) =>
				this.handleLeaveConversation(socket, data)
			);

			// Send message
			socket.on("send_message", (data) =>
				this.handleSendMessage(socket, data)
			);

			// Typing indicator
			socket.on("typing", (data) => this.handleTyping(socket, data));

			// Stop typing indicator
			socket.on("stop_typing", (data) =>
				this.handleStopTyping(socket, data)
			);

			// Mark message as read
			socket.on("mark_message_read", (data) =>
				this.handleMarkMessageRead(socket, data)
			);

			// Disconnect
			socket.on("disconnect", () => this.handleDisconnect(socket));
		});
	}

	/**
	 * Xác thực socket connection
	 */
	private handleAuthentication(socket: Socket): void {
		const { userId, userType } = socket.handshake.auth as ISocketData;

		if (!userId || !userType) {
			logger.warn(`Unauthenticated socket connection: ${socket.id}`);
			socket.disconnect();
			return;
		}

		// Store user info in socket data
		socket.data.userId = userId;
		socket.data.userType = userType;

		// Track online user
		this.onlineUsers.set(userId, socket.id);

		logger.info(
			`User ${userId} (${userType}) authenticated on socket ${socket.id}`
		);

		// Emit user online status to all connections
		socket.broadcast.emit("user_online", { userId, userType });
	}

	/**
	 * User join một conversation room
	 */
	private async handleJoinConversation(
		socket: Socket,
		data: { conversationId: string }
	): Promise<void> {
		try {
			const { conversationId } = data;
			const userId = socket.data.userId;

			if (!conversationId) {
				socket.emit("error", { message: "conversationId is required" });
				return;
			}

			// Verify user is participant
			const conversation =
				await this.conversationService.getConversationById(
					conversationId,
					userId
				);

			if (!conversation) {
				socket.emit("error", { message: "Conversation not found" });
				return;
			}

			// Join room
			socket.join(conversationId);

			// Track room
			if (!this.userRooms.has(socket.id)) {
				this.userRooms.set(socket.id, new Set());
			}
			this.userRooms.get(socket.id)!.add(conversationId);

			logger.info(`User ${userId} joined conversation ${conversationId}`);

			// Notify others in the room
			socket.to(conversationId).emit("user_joined_conversation", {
				userId,
				conversationId,
			});
		} catch (error) {
			logger.error("Error joining conversation:", error);
			socket.emit("error", { message: "Failed to join conversation" });
		}
	}

	/**
	 * User leave một conversation room
	 */
	private handleLeaveConversation(
		socket: Socket,
		data: { conversationId: string }
	): void {
		try {
			const { conversationId } = data;
			const userId = socket.data.userId;

			socket.leave(conversationId);

			// Remove from tracking
			if (this.userRooms.has(socket.id)) {
				this.userRooms.get(socket.id)!.delete(conversationId);
			}

			logger.info(`User ${userId} left conversation ${conversationId}`);

			// Notify others in the room
			socket.to(conversationId).emit("user_left_conversation", {
				userId,
				conversationId,
			});
		} catch (error) {
			logger.error("Error leaving conversation:", error);
		}
	}

	/**
	 * Gửi message real-time
	 */
	private async handleSendMessage(
		socket: Socket,
		data: { conversationId: string; content: string }
	): Promise<void> {
		try {
			const { conversationId, content } = data;
			const userId = socket.data.userId;
			const userType = socket.data.userType;

			if (!conversationId || !content) {
				socket.emit("error", {
					message: "conversationId and content are required",
				});
				return;
			}

			// Send message through service
			const message = await this.messageService.sendMessage(
				conversationId,
				{ id: userId, type: userType as ParticipantType },
				content
			);

			// Emit to all users in the conversation room
			this.io.to(conversationId).emit("new_message", {
				message,
				conversationId,
			});

			logger.info(
				`Message sent in conversation ${conversationId} by user ${userId}`
			);
		} catch (error) {
			logger.error("Error sending message:", error);
			socket.emit("error", { message: "Failed to send message" });
		}
	}

	/**
	 * User đang typing
	 */
	private handleTyping(socket: Socket, data: ITypingData): void {
		const { conversationId } = data;
		const userId = socket.data.userId;

		// Notify others in the room
		socket.to(conversationId).emit("user_typing", {
			conversationId,
			userId,
			isTyping: true,
		});
	}

	/**
	 * User ngừng typing
	 */
	private handleStopTyping(socket: Socket, data: ITypingData): void {
		const { conversationId } = data;
		const userId = socket.data.userId;

		// Notify others in the room
		socket.to(conversationId).emit("user_typing", {
			conversationId,
			userId,
			isTyping: false,
		});
	}

	/**
	 * Đánh dấu message đã đọc real-time
	 */
	private async handleMarkMessageRead(
		socket: Socket,
		data: IMessageReadData
	): Promise<void> {
		try {
			const { conversationId, messageId } = data;
			const userId = socket.data.userId;

			// Mark as read through service
			await this.messageService.markMessageAsRead(messageId, userId);

			// Notify others in the room
			this.io.to(conversationId).emit("message_read", {
				conversationId,
				messageId,
				userId,
				readAt: new Date(),
			});

			logger.info(
				`Message ${messageId} marked as read by user ${userId}`
			);
		} catch (error) {
			logger.error("Error marking message as read:", error);
			socket.emit("error", { message: "Failed to mark message as read" });
		}
	}

	/**
	 * Handle disconnect
	 */
	private handleDisconnect(socket: Socket): void {
		const userId = socket.data.userId;

		// Remove from online users
		if (userId) {
			this.onlineUsers.delete(userId);

			// Notify all about user offline
			socket.broadcast.emit("user_offline", { userId });

			logger.info(`User ${userId} disconnected`);
		}

		// Clean up rooms
		this.userRooms.delete(socket.id);

		logger.info(`Client disconnected: ${socket.id}`);
	}

	/**
	 * Get online users
	 */
	public getOnlineUsers(): string[] {
		return Array.from(this.onlineUsers.keys());
	}

	/**
	 * Check if user is online
	 */
	public isUserOnline(userId: string): boolean {
		return this.onlineUsers.has(userId);
	}
}
