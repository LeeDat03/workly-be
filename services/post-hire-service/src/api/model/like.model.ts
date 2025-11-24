import { ObjectId } from "bson/bson";

export enum FeelingType {
	POST = 'POST',
	COMMENT = 'COMMENT',
}

export interface Feeling {
	_id: ObjectId;
	postId: ObjectId;
	commentId: ObjectId;
	authorId: ObjectId;
	type: FeelingType;
	createdAt: Date;
}

export interface FeelingResponse {
	postId: string;
	commentId: string;
	authorId: string;
	type: FeelingType;
}

