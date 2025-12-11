import { ObjectId } from "bson/bson";

export enum BookmarkType {
	POST = 'POST',
	JOB = 'JOB',
}

export interface Bookmark {
	_id: ObjectId;
	userId: string;
	itemId: string; // postId or jobId
	type: BookmarkType;
	createdAt: Date;
}

export interface BookmarkResponse {
	_id: string;
	userId: string;
	itemId: string;
	type: BookmarkType;
	createdAt: string;
}

export interface CreateBookmarkDTO {
	userId: string;
	itemId: string;
	type: BookmarkType;
}

export interface DeleteBookmarkDTO {
	userId: string;
	itemId: string;
	type: BookmarkType;
}

