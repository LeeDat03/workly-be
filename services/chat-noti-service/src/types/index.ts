export enum ParticipantType {
	USER = "USER",
	COMPANY = "COMPANY",
}

export enum MessageStatus {
	SENT = "sent",
	DELIVERED = "delivered",
	READ = "read",
}

export interface IParticipant {
	id: string;
	type: ParticipantType;
}

export interface IAuthRequest {
	body?: any;
	query?: any;
	params?: any;
	headers?: any;
	cookies?: any;
	user?: {
		id: string;
		type: ParticipantType;
	};
}

export interface ISocketData {
	// userId: string;
	// userType: ParticipantType;
	token: string;
}

export interface ITypingData {
	conversationId: string;
	userId: string;
	isTyping: boolean;
}

export interface IMessageReadData {
	conversationId: string;
	messageId: string;
	userId: string;
}
