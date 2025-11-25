import mongoose, { Schema, Document, Model } from "mongoose";
import { ParticipantType, MessageStatus } from "../types";

interface ISender {
	id: string;
	type: ParticipantType;
}

interface IReadBy {
	participantId: string;
	readAt: Date;
}

export interface IMessage extends Document {
	conversationId: mongoose.Types.ObjectId;
	sender: ISender;
	content: string;
	status: MessageStatus;
	readBy: IReadBy[];
	createdAt: Date;
	updatedAt: Date;
	// Instance methods
	markAsRead(participantId: string): Promise<IMessage>;
}

const SenderSchema = new Schema<ISender>(
	{
		id: {
			type: String,
			required: true,
		},
		type: {
			type: String,
			enum: Object.values(ParticipantType),
			required: true,
		},
	},
	{ _id: false }
);

const ReadBySchema = new Schema<IReadBy>(
	{
		participantId: {
			type: String,
			required: true,
		},
		readAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ _id: false }
);

const MessageSchema = new Schema<IMessage>(
	{
		conversationId: {
			type: Schema.Types.ObjectId,
			ref: "Conversation",
			required: true,
			index: true,
		},
		sender: {
			type: SenderSchema,
			required: true,
		},
		content: {
			type: String,
			required: true,
			trim: true,
		},
		status: {
			type: String,
			enum: Object.values(MessageStatus),
			default: MessageStatus.SENT,
		},
		readBy: {
			type: [ReadBySchema],
			default: [],
		},
	},
	{
		timestamps: true,
		toJSON: {
			virtuals: true,
			transform: function (_doc: any, ret: any) {
				delete ret.__v;
				return ret;
			},
		},
	}
);

// Index để query messages theo conversation
MessageSchema.index({ conversationId: 1, createdAt: -1 });

// Lấy messages của một conversation
MessageSchema.statics.findByConversation = async function (
	conversationId: string,
	page: number = 1,
	limit: number = 50
): Promise<IMessage[]> {
	return this.find({ conversationId })
		.sort({ createdAt: -1 })
		.skip((page - 1) * limit)
		.limit(limit);
};

// Đánh dấu message đã đọc
MessageSchema.methods.markAsRead = async function (
	participantId: string
): Promise<IMessage> {
	// Kiểm tra xem participant đã đọc chưa
	const alreadyRead = this.readBy.some(
		(read: IReadBy) => read.participantId === participantId
	);

	if (!alreadyRead) {
		this.readBy.push({
			participantId,
			readAt: new Date(),
		});

		// Update status nếu cả 2 participants đã đọc
		if (this.readBy.length === 2) {
			this.status = MessageStatus.READ;
		}

		await this.save();
	}

	return this as unknown as IMessage;
};

// Đếm số unread messages
MessageSchema.statics.countUnreadByConversation = async function (
	conversationId: string,
	participantId: string
): Promise<number> {
	return this.countDocuments({
		conversationId,
		"sender.id": { $ne: participantId },
		"readBy.participantId": { $ne: participantId },
	});
};

interface IMessageModel extends Model<IMessage> {
	findByConversation(
		conversationId: string,
		page?: number,
		limit?: number
	): Promise<IMessage[]>;
	countUnreadByConversation(
		conversationId: string,
		participantId: string
	): Promise<number>;
}

export const Message = mongoose.model<IMessage, IMessageModel>(
	"Message",
	MessageSchema
);
