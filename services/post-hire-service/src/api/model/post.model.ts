import { Document, ObjectId, WithId } from 'mongodb';

export enum PostVisibilityType {
    PRIVATE = 'PRIVATE',
    PUBLIC = 'PUBLIC',
    FOLLOWER = 'FOLLOWER',
}

export enum MediaType {
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO'
}

export enum AuthorType {
    USER = 'USER',
    COMPANY = 'COMPANY'
}

export interface MediaItem {
    url: string;
    type: MediaType;
}


export interface Post {
    _id: ObjectId;
    author_type: AuthorType;
    author_id: ObjectId;
    content: string;
    media_url: MediaItem[];
    visibility: PostVisibilityType;
    created_at: Date;
    updated_at: Date;
}

export interface CreatePostDTO {
    content: string;
    media_url: MediaItem[];
    visibility: PostVisibilityType;
}

export interface UpdatePostDTO {
    content?: string;
    media_url?: {
        add: MediaItem[],
        delete: MediaItem[]
    };
    visibility?: PostVisibilityType;
}

export interface PostResponse {
    _id: string;
    author_type: AuthorType;
    author_id: string;
    content: string;
    media_url: MediaItem[];
    visibility: PostVisibilityType;
}

export function mapToPostResponse(doc: WithId<Document>): PostResponse {
    return {
        _id: doc._id.toString(),
        author_type: doc.author_type,
        author_id: doc.author_id,
        content: doc.content,
        media_url: doc.media_url,
        visibility: doc.visibility,
    };
}