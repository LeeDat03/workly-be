import { InsertOneResult } from "mongodb";
import { ILikeRepository, likeRepository } from "../repository/like.repository";
import { FeelingResponse } from "../model/like.model";
import { APIError } from "@/common/error/api.error";
import { StatusCode } from "@/common/errors";

export interface ILikeService {
    likePost(userId: string | undefined, postId: string): Promise<InsertOneResult>
    unlikePost(postId: string, userId: string): Promise<boolean>;
    getAllLikePost(postId: string): Promise<FeelingResponse[]>;
    likeComment(userId: string, commentId: string): Promise<InsertOneResult>
}

export class LikeService implements ILikeService {
    private likeRepository: ILikeRepository;
    constructor(
        likeRepository: ILikeRepository
    ) {
        this.likeRepository = likeRepository
    }
    async likeComment(userId: string, commentId: string): Promise<InsertOneResult> {
        return await this.likeRepository.likeComment(userId, commentId)
    }
    async likePost(userId: string, postId: string): Promise<InsertOneResult> {
        return await this.likeRepository.likePost(userId, postId)
    }
    async unlikePost(postId: string, userId: string): Promise<boolean> {
        const data = await this.likeRepository.unlikePost(postId, userId)
        if (!data) {
            throw new APIError({ message: "like.notfound", status: StatusCode.REQUEST_NOT_FOUND });
        }
        return data
    }
    async getAllLikePost(postId: string): Promise<FeelingResponse[]> {
        return await this.likeRepository.getAllLikePost(postId)
    }
}