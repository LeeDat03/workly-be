import { NextFunction, Request, Response } from "express";
import { IPostService } from "@/api/service/post.service";
import logger from "@/common/logger";
import { CreatePostDTO } from "@/api/model/post.model";

export class PostController {
    private postService: IPostService

    constructor(
        postService: IPostService
    ) {
        this.postService = postService
    }

    public createPost = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const body = req.body as CreatePostDTO
            await this.postService.createPost(body)
            res.sendJson(body)
        } catch (error) {
            logger.error(`PostController.create: `, error)
            next(error);
        }
    }

    public getPosts = async (req: Request, res: Response, next: NextFunction) => {

    }

    public getPostDetail = async (req: Request, res: Response, next: NextFunction) => {

    }

    public deletePost = async (req: Request, res: Response, next: NextFunction) => {

    }

    public updatePost = async (req: Request, res: Response, next: NextFunction) => {

    }
}