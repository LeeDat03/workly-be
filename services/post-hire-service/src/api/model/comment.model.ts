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
    postId: string;
    parentId?: string; //null -> root comment
    authorId: ObjectId;
    content: string;
    mediaFile?: string;
}

export interface CommentResponse {
    id: string;
    authorId: string;
    content: string;
    mediaFile?: string;
    replyCount: number;
    parentId?: string; //null -> root comment
}

export interface UpdateCommentDTO {
    content: string;
    mediaFile?: {
        add: string,
        delete: string
    };
}
