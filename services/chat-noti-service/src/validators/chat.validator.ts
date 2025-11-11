import Joi from "joi";
import { ParticipantType } from "../types";

export const createConversationSchema = Joi.object({
	body: Joi.object({
		participantId: Joi.string().required(),
		participantType: Joi.string()
			.valid(...Object.values(ParticipantType))
			.required(),
	}),
});

export const getConversationsSchema = Joi.object({
	query: Joi.object({
		page: Joi.number().integer().min(1).default(1),
		limit: Joi.number().integer().min(1).max(100).default(20),
	}),
});

export const getConversationByIdSchema = Joi.object({
	params: Joi.object({
		id: Joi.string().required(),
	}),
});

export const sendMessageSchema = Joi.object({
	body: Joi.object({
		conversationId: Joi.string().required(),
		content: Joi.string().trim().min(1).required(),
	}),
});

export const getMessagesSchema = Joi.object({
	params: Joi.object({
		conversationId: Joi.string().required(),
	}),
	query: Joi.object({
		page: Joi.number().integer().min(1).default(1),
		limit: Joi.number().integer().min(1).max(100).default(50),
	}),
});

export const markMessageAsReadSchema = Joi.object({
	params: Joi.object({
		messageId: Joi.string().required(),
	}),
});

export const markAllMessagesAsReadSchema = Joi.object({
	params: Joi.object({
		conversationId: Joi.string().required(),
	}),
});
