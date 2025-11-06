import { ObjectId } from "bson/bson";

export enum CommentType {
    LIKE = 'LIKE',
    LOVE = 'LOVE',
    SMILE = 'SMILE',
    ANGRY = 'ANGRY',
    SAD = 'SAD'
}

export interface Comment {
    _id: ObjectId;
    postId: ObjectId;
    commentId: ObjectId;
    authorId: ObjectId;
    type: CommentType;
    createdAt: Date;
}