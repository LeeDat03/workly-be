import { ObjectId } from "bson/bson";

export enum FeelingType {
	LIKE = "LIKE",
	LOVE = "LOVE",
	SMILE = "SMILE",
	ANGRY = "ANGRY",
	SAD = "SAD",
}

export interface Feeling {
	_id: ObjectId;
	postId: ObjectId;
	commentId: ObjectId;
	authorId: ObjectId;
	type: FeelingType;
	createdAt: Date;
}
