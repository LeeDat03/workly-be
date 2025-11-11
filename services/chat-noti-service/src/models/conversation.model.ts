import mongoose, { Schema, Document, Model } from "mongoose";
import { ParticipantType } from "../types";

interface IParticipant {
	id: string;
	type: ParticipantType;
}

export interface IConversation extends Document {
	participants: IParticipant[];
	lastMessage?: mongoose.Types.ObjectId;
	lastMessageAt?: Date;
	unreadCount: Map<string, number>; // participantId -> count
	createdAt: Date;
	updatedAt: Date;
}

const ParticipantSchema = new Schema<IParticipant>(
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

const ConversationSchema = new Schema<IConversation>(
	{
		participants: {
			type: [ParticipantSchema],
			required: true,
			validate: {
				validator: function (v: IParticipant[]) {
					return v.length === 2;
				},
				message: "Conversation must have exactly 2 participants",
			},
		},
		lastMessage: {
			type: Schema.Types.ObjectId,
			ref: "Message",
		},
		lastMessageAt: {
			type: Date,
		},
		unreadCount: {
			type: Map,
			of: Number,
			default: new Map(),
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

// Index để tìm kiếm conversation nhanh
ConversationSchema.index({ "participants.id": 1 });
ConversationSchema.index({ lastMessageAt: -1 });

// Kiểm tra xem conversation giữa 2 participants đã tồn tại chưa
ConversationSchema.statics.findByParticipants = async function (
	participant1: IParticipant,
	participant2: IParticipant
): Promise<IConversation | null> {
	return this.findOne({
		participants: {
			$all: [
				{
					$elemMatch: {
						id: participant1.id,
						type: participant1.type,
					},
				},
				{
					$elemMatch: {
						id: participant2.id,
						type: participant2.type,
					},
				},
			],
		},
	});
};

// Lấy tất cả conversations của một participant
ConversationSchema.statics.findByParticipant = async function (
	participantId: string,
	participantType: ParticipantType,
	page: number = 1,
	limit: number = 20
): Promise<IConversation[]> {
	return this.find({
		"participants.id": participantId,
		"participants.type": participantType,
	})
		.populate("lastMessage")
		.sort({ lastMessageAt: -1 })
		.skip((page - 1) * limit)
		.limit(limit);
};

interface IConversationModel extends Model<IConversation> {
	findByParticipants(
		participant1: IParticipant,
		participant2: IParticipant
	): Promise<IConversation | null>;
	findByParticipant(
		participantId: string,
		participantType: ParticipantType,
		page?: number,
		limit?: number
	): Promise<IConversation[]>;
}

export const Conversation = mongoose.model<IConversation, IConversationModel>(
	"Conversation",
	ConversationSchema
);
