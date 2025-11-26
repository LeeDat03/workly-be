import { IPostService } from "@/api/service/post.service";
import { ICommentService } from "@/api/service/comment.service";
import { NextFunction, Request, Response } from "express";
import logger from "@/common/logger";
import { CreateCommentDTO, UpdateCommentDTO } from "@/api/model/comment.model";
import { ObjectId } from "mongodb";
import axios from "axios";
import { User } from "../model/post.model";


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
            const result = await this.commentService.createComment({ ...data, authorId: req.user!!.userId });
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
            const result = await this.commentService.getAllComment(postId);
            const userIds = result.map(comment => comment.authorId);
            if (userIds.length > 0) {
                const response = await axios.post(
                    `http://localhost:8003/api/v1/internals/users/get-batch`,
                    { userIds },
                    {
                        headers: {
                            Cookie: req.headers.cookie,
                            Authorization: req.headers.authorization,
                        },
                        withCredentials: true,
                    }
                );
                const usersMap = new Map(response.data.data.map((user: User) => [user.userId, user]));
                const commentsWithAuthor = result.map(post => ({
                    ...post,
                    author: usersMap.get(post.authorId) || null
                }));
                console.log(commentsWithAuthor);

                res.sendJson(commentsWithAuthor)
            } else {
                res.sendJson(result)
            }
        } catch (error) {
            logger.error('CommentController.updateComment', error);
            next(error);
        }
    }

    public getCommentById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const commentId = req.params.commentId
            const result = await this.commentService.getCommentById(commentId);
            const userIds = [result.authorId];
            if (userIds.length > 0) {
                const response = await axios.post(
                    `http://localhost:8003/api/v1/internals/users/get-batch`,
                    { userIds },
                    {
                        headers: {
                            Cookie: req.headers.cookie,
                            Authorization: req.headers.authorization,
                        },
                        withCredentials: true,
                    }
                );
                console.log("response", response);

                const usersMap = new Map(response.data.data.map((user: User) => [user.userId, user]));
                result.author = usersMap.get(result.authorId) || null

                res.sendJson(result)
            } else {
                res.sendJson(result)
            }
        } catch (error) {
            logger.error('CommentController.updateComment', error);
            next(error);
        }
    }
}