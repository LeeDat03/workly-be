import { Server, Socket } from "socket.io";
import { MessageService, ConversationService } from "../services";
import { logger } from "../utils";
import {
	ISocketData,
	ITypingData,
	IMessageReadData,
	ParticipantType,
} from "../types";
import jwt, { Jwt } from "jsonwebtoken";
import { config } from "../config";

export class ChatSocket {
	private io: Server;
	private messageService: MessageService;
	private conversationService: ConversationService;

	// Map để track users online và rooms họ đang ở
	private onlineUsers: Map<
		string,
		{ socketIds: Set<string>; userType: string }
	> = new Map(); // userId -> {socketIds, userType}
	private userRooms: Map<string, Set<string>> = new Map(); // socketId -> Set of conversationIds

	constructor(io: Server) {
		this.io = io;
		this.messageService = new MessageService();
		this.conversationService = new ConversationService();
		this.initializeSocketHandlers();
	}

	private initializeSocketHandlers(): void {
		this.io.on("connection", (socket: Socket) => {
			this.handleAuthentication(socket);

			// Get online users
			socket.on("get_online_users", () =>
				this.handleGetOnlineUsers(socket)
			);

			socket.on("join_conversation", (data) =>
				this.handleJoinConversation(socket, data)
			);
			socket.on("leave_conversation", (data) =>
				this.handleLeaveConversation(socket, data)
			);

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
		const {
			token,
			userId: overrideUserId,
			userType: overrideUserType,
		} = socket.handshake.auth as ISocketData & {
			userId?: string;
			userType?: string;
		};

		try {
			const decoded = jwt.verify(
				token,
				config.jwt.secret
			) as jwt.JwtPayload;

			if (!decoded || !decoded.id) {
				logger.warn(`Invalid JWT token: ${socket.id}`);
				socket.disconnect();
				return;
			}

			// Default to USER type if no role in JWT (for backward compatibility)
			const jwtUserType = (decoded as any).role || "USER";

			// Use override identity if provided (company mode), otherwise use JWT identity
			const actualUserId = overrideUserId || decoded.id;
			const actualUserType = overrideUserType || jwtUserType;

			// Store user info in socket data
			socket.data.userId = actualUserId;
			socket.data.userType = actualUserType;

			// Track online user
			const existing = this.onlineUsers.get(actualUserId);
			const socketIds = existing?.socketIds ?? new Set<string>();
			const wasOnline = socketIds.size > 0;
			socketIds.add(socket.id);

			this.onlineUsers.set(actualUserId, {
				socketIds,
				userType: actualUserType,
			});

			// Emit user online status to all connections only when first socket connects
			if (!wasOnline) {
				socket.broadcast.emit("user_online", {
					userId: actualUserId,
					userType: actualUserType,
				});
			}

			// Send updated online users list to all clients
			this.io.emit("online_users_list", {
				users: this.getOnlineUsersWithDetails(),
			});
		} catch (error) {
			logger.error(`Socket authentication error: ${error}`);
			socket.disconnect();
			return;
		}
	}

	/**
	 * Get list of online users
	 */
	private handleGetOnlineUsers(socket: Socket): void {
		const onlineUsers = this.getOnlineUsersWithDetails();
		socket.emit("online_users_list", { users: onlineUsers });
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

			// Emit success to the user who joined
			socket.emit("join_conversation_success", {
				conversationId,
				message: "Successfully joined conversation",
			});

			// Notify others in the room
			socket.to(conversationId).emit("user_joined_conversation", {
				userId,
				conversationId,
			});
		} catch (error) {
			logger.error("Error joining conversation:", error);
			const errorMessage =
				error instanceof Error
					? error.message
					: "Failed to join conversation";
			socket.emit("error", { message: errorMessage });
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
				userId,
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
			const entry = this.onlineUsers.get(userId);
			if (entry) {
				entry.socketIds.delete(socket.id);
				const isOffline = entry.socketIds.size === 0;
				if (isOffline) {
					this.onlineUsers.delete(userId);

					// Notify all about user offline
					socket.broadcast.emit("user_offline", { userId });

					// Send updated online users list to all clients
					this.io.emit("online_users_list", {
						users: this.getOnlineUsersWithDetails(),
					});

					logger.info(`User ${userId} disconnected`);
				} else {
					// still online on other sockets, keep entry
					this.onlineUsers.set(userId, entry);
				}
			}
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
	 * Get online users with details
	 */
	public getOnlineUsersWithDetails(): Array<{
		userId: string;
		userType: string;
	}> {
		return Array.from(this.onlineUsers.entries()).map(
			([userId, { userType }]) => ({
				userId,
				userType,
			})
		);
	}

	/**
	 * Check if user is online
	 */
	public isUserOnline(userId: string): boolean {
		return this.onlineUsers.has(userId);
	}
}
