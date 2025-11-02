import { ObjectId } from "bson/bson";

export interface Comment {
    _id: ObjectId;
    postId: ObjectId;
    parentId?: ObjectId;
    authorId: ObjectId;
    content: string;
    mediaFile?: string;
    createdAt: Date;
}

export interface CreateCommentDTO {
    postId: ObjectId;
    parentId?: ObjectId; //null -> root comment
    authorId: ObjectId;
    content: string;
    mediaFile?: string;
}

export interface UpdateCommentDTO {
    content: string;
    mediaFile?: {
        add: string,
        delete: string
    };
}