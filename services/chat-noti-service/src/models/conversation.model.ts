import mongoose, { Schema, Document, Model } from "mongoose";
import { ParticipantType } from "../types";

interface IParticipant {
	id: string;
	type: ParticipantType;
}

export interface IConversation extends Document {
	participants: IParticipant[];
	participantKey: string; // Sorted unique key for uniqueness constraint
	lastMessage?: mongoose.Types.ObjectId;
	lastMessageAt?: Date;
	unreadCount: Map<string, number>; // participantId -> count
	deletedParticipants: Map<string, Date>; // participantId -> deletedAt timestamp
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
		participantKey: {
			type: String,
			required: true,
			unique: true, // Unique constraint to prevent duplicates
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
		deletedParticipants: {
			type: Map,
			of: Date,
			default: new Map(),
		},
	},
	{
		timestamps: true,
		toJSON: {
			virtuals: true,
			transform: function (_doc: any, ret: any) {
				delete ret.__v;
				// Convert deletedParticipants Map to plain object for JSON serialization
				if (ret.deletedParticipants && ret.deletedParticipants instanceof Map) {
					const deletedObj: Record<string, string> = {};
					ret.deletedParticipants.forEach((value: Date, key: string) => {
						deletedObj[key] = value.toISOString();
					});
					ret.deletedParticipants = deletedObj;
				}
				return ret;
			},
		},
	}
);

// Index để tìm kiếm conversation nhanh
ConversationSchema.index({ "participants.id": 1 });
ConversationSchema.index({ lastMessageAt: -1 });

// Compound index to prevent duplicate conversations between same participants
// This ensures that only ONE conversation can exist between two specific participants
// Note: MongoDB doesn't support unique index on array elements directly,
// so we'll handle uniqueness in application logic with proper error handling
ConversationSchema.index({ participants: 1 });

// Kiểm tra xem conversation giữa 2 participants đã tồn tại chưa
ConversationSchema.statics.findByParticipants = async function (
	participant1: IParticipant,
	participant2: IParticipant
): Promise<IConversation | null> {
	// Use $all to find conversation containing both participants
	// This works regardless of participant order in the array
	return this.findOne({
		$and: [
			{
				participants: {
					$elemMatch: {
						id: participant1.id,
						type: participant1.type,
					},
				},
			},
			{
				participants: {
					$elemMatch: {
						id: participant2.id,
						type: participant2.type,
					},
				},
			},
		],
	}).sort({ lastMessageAt: -1 }); // Return most recent if somehow duplicates exist
};

// Lấy tất cả conversations của một participant
ConversationSchema.statics.findByParticipant = async function (
	participantId: string,
	participantType: ParticipantType,
	page: number = 1,
	limit: number = 20
): Promise<IConversation[]> {
	// Use $elemMatch to ensure BOTH id AND type belong to the SAME participant
	const query = {
		participants: {
			$elemMatch: {
				id: participantId,
				type: participantType, // Already uppercase from frontend
			},
		},
	};

	const results = await this.find(query)
		.populate("lastMessage")
		.sort({ lastMessageAt: -1 })
		.skip((page - 1) * limit)
		.limit(limit);

	return results;
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
