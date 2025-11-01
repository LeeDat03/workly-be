import { ObjectId } from 'mongodb';

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
    author_type: AuthorType;
    author_id: ObjectId | string;
    content: string;
    media_url: MediaItem[];
    visibility: PostVisibilityType;
}

export interface UpdatePostDTO {
    author_type?: string;
    content?: string;
    media_url?: MediaItem[];
    visibility?: PostVisibilityType;
}

export interface PostResponse {
    _id: string;
    author_type: AuthorType;
    author_id: string;
    content: string;
    media_url: MediaItem[];
    visibility: PostVisibilityType;
    created_at: string;
    updated_at: string;
}