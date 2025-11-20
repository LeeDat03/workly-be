import { IPostService } from "@/api/service/post.service";
import { ICommentService } from "@/api/service/comment.service";
import { NextFunction, Request, Response } from "express";
import logger from "@/common/logger";
import { CreateCommentDTO, UpdateCommentDTO } from "@/api/model/comment.model";
import { ObjectId } from "mongodb";


export class CommentController {
    private commentService: ICommentService;
    constructor(
        commentService: ICommentService
    ) {
        this.commentService = commentService
    }

    public createComment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = req.body as CreateCommentDTO
            const result = await this.commentService.createComment({ ...data, authorId: new ObjectId("69104f33ace675418225c6f1") });
            res.sendJson(result)
        } catch (error) {
            logger.error('CommentController.createComment', error);
            next(error);
        }
    }

    public updateComment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const commentId = new ObjectId(req.params.id)
            const data = req.body as UpdateCommentDTO
            const result = await this.commentService.updateComment(data, commentId);
            res.sendJson(result)
        } catch (error) {
            logger.error('CommentController.updateComment', error);
            next(error);
        }
    }

    public getAllComment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postId = req.params.postId
            console.log(postId);

            const result = await this.commentService.getAllComment(postId);
            res.sendJson(result)
        } catch (error) {
            logger.error('CommentController.updateComment', error);
            next(error);
        }
    }

    public getCommentById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const commentId = req.params.commentId

            const result = await this.commentService.getCommentById(commentId);
            res.sendJson(result)
        } catch (error) {
            logger.error('CommentController.updateComment', error);
            next(error);
        }
    }
}