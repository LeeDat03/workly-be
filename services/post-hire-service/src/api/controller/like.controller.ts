import { NextFunction, Request, Response } from "express";
import { ILikeService } from "../service/like.service";
import logger from "@/common/logger";

export class LikeController {
    private likeService: ILikeService;
    constructor(
        likeService: ILikeService
    ) {
        this.likeService = likeService
    }
    public likeComment = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const commentId = req.body.commentId;
            const userId = req.user!!.userId;
            const result = await this.likeService.likeComment(userId, commentId);
            res.sendJson(result)
        } catch (error) {
            logger.error(`PostController.create: `, error);
            next(error);
        }
    };

    public likePost = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const postId = req.body.postId;
            const userId = req.user!!.userId;
            const result = await this.likeService.likePost(userId, postId);
            res.sendJson(result)
        } catch (error) {
            logger.error(`PostController.create: `, error);
            next(error);
        }
    };

    public unlikePost = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const postId = req.body.postId;
            const userId = req.user!!.userId;
            console.log(postId, userId);
            const result = await this.likeService.unlikePost(postId, userId);
            res.sendJson(result)
        } catch (error) {
            logger.error(`PostController.create: `, error);
            next(error);
        }
    };

    public getAllLikePost = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const postId = req.query.postId as string;
            const result = await this.likeService.getAllLikePost(postId);
            res.sendJson(result)
        } catch (error) {
            logger.error(`PostController.create: `, error);
            next(error);
        }
    };
}