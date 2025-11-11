export enum ParticipantType {
  USER = 'user',
  COMPANY = 'company',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
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
  user?: {
    id: string;
    type: ParticipantType;
  };
}

export interface ISocketData {
  userId: string;
  userType: ParticipantType;
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

