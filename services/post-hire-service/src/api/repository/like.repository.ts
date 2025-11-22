import { DatabaseAdapter } from "@/common/infrastructure/database.adapter";
import { TimeHelper } from "@/util/time.util";
import { InsertOneResult } from "mongodb/mongodb";
import { FeelingResponse, FeelingType } from "../model/like.model";

export interface ILikeRepository {
    likePost(userId: string, postId: string): Promise<InsertOneResult>;
    unlikePost(postId: string, userId: string): Promise<boolean>;
    getAllLikePost(postId: string): Promise<FeelingResponse[]>;
    getAllLikeByListPost(postIds: string[]): Promise<Record<string, FeelingResponse[]>>;
    likeComment(userId: string, commentId: string): Promise<InsertOneResult>;
    unlikeComment(commentId: string, userId: string): Promise<boolean>;
    getAllLikeByListComment(commentIds: string[]): Promise<Record<string, FeelingResponse[]>>
}

export class likeRepository implements ILikeRepository {

    private likeCollection: DatabaseAdapter;
    constructor(
        likeCollection: DatabaseAdapter
    ) {
        this.likeCollection = likeCollection
    }



    public likeComment = async (userId: string, commentId: string): Promise<InsertOneResult> => {
        return await this.likeCollection.like.insertOne({ authorId: userId, commentId: commentId, type: FeelingType.COMMENT, createdAt: TimeHelper.now().format('YYYY-MM-DD HH:mm:ss') })
    }

    public unlikeComment = async (commentId: string, userId: string): Promise<boolean> => {
        const result = await this.likeCollection.like.deleteOne({ commentId: commentId, authorId: userId, type: FeelingType.COMMENT });
        console.log(result);
        return result.deletedCount > 0;
    };

    public getAllLikeByListComment = async (commentIds: string[]): Promise<Record<string, FeelingResponse[]>> => {
        const allLikes = await this.likeCollection.like.find<FeelingResponse>({
            commentId: { $in: commentIds },
            type: FeelingType.COMMENT
        }).toArray();

        const likesMap: Record<string, FeelingResponse[]> = {};
        for (const like of allLikes) {
            if (!likesMap[like.commentId]) likesMap[like.commentId] = [];
            likesMap[like.commentId].push(like);
        }

        return likesMap;
    };

    public likePost = async (userId: string, postId: string): Promise<InsertOneResult> => {
        return await this.likeCollection.like.insertOne({ authorId: userId, postId: postId, type: FeelingType.POST, createdAt: TimeHelper.now().format('YYYY-MM-DD HH:mm:ss') })
    }

    public unlikePost = async (postId: string, userId: string): Promise<boolean> => {
        const result = await this.likeCollection.like.deleteOne({ postId: postId, authorId: userId, type: FeelingType.POST });
        console.log(result);
        return result.deletedCount > 0;
    };

    public getAllLikePost = async (postId: string): Promise<FeelingResponse[]> => {
        return await this.likeCollection.like.find<FeelingResponse>({ postId: postId.trim(), type: FeelingType.POST.trim() }).sort({ createdAt: -1 }).toArray();
    }

    public getAllLikeByListPost = async (postIds: string[]): Promise<Record<string, FeelingResponse[]>> => {
        const allLikes = await this.likeCollection.like.find<FeelingResponse>({
            postId: { $in: postIds },
            type: FeelingType.POST
        }).toArray();

        const likesMap: Record<string, FeelingResponse[]> = {};
        for (const like of allLikes) {
            if (!likesMap[like.postId]) likesMap[like.postId] = [];
            likesMap[like.postId].push(like);
        }

        return likesMap;
    };
}