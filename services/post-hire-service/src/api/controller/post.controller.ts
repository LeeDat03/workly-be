import { NextFunction, Request, Response } from "express";
import { IPostService } from "@/api/service/post.service";
import logger from "@/common/logger";
import { CreatePostDTO, UpdatePostDTO } from "@/api/model/post.model";
import { ObjectId } from "mongodb";
import { IPaginationInput } from "../model/common.model";
import { ADD_POST_JOB as JOB_NAME } from "@/config/job.constant"
import path from "path";
import fs from "fs"
import mime from 'mime-types';
import { QueueService } from "../service/queue.service";

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
            const queue = await QueueService.getQueue<any>(JOB_NAME);
            queue.add({ a: "hihi", b: "hahah" }, { removeOnComplete: true, removeOnFail: true })
            const result = await this.postService.createPost(body)
            res.sendJson(result)
        } catch (error) {
            logger.error(`PostController.create: `, error)
            next(error);
        }
    }

    public uploadFile = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = req.file;

            res.sendJson(data);
        } catch (error) {
            logger.error('PostController.uploadFile', error);
            next(error);
        }
    }
    public updatePost = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const body = req.body as UpdatePostDTO
            const objectId = new ObjectId(req.params.id);
            const result = await this.postService.updatePost(body, objectId);
            res.sendJson(result);
        } catch (error) {
            logger.error('PostController.updatePost', error);
            next(error);
        }
    }

    public getPostDetail = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const objectId = new ObjectId(req.params.id);
            const result = await this.postService.getPostDetail(objectId);
            res.sendJson(result);
        } catch (error) {
            logger.error('PostController.updatePost', error);
            next(error);
        }
    }

    public getStreamVideo = async (req: Request, res: Response, next: NextFunction) => {
        const videoPath = path.join(__dirname, '../../../uploads/videos', req.params.filename);

        if (!fs.existsSync(videoPath)) {
            return res.status(404).send('Video not found');
        }

        const fileSize = fs.statSync(videoPath).size;
        const range = req.headers.range;
        if (!range) {
            // Không có range => gửi toàn bộ video
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': mime.lookup(videoPath) || 'video/mp4',
            });
            fs.createReadStream(videoPath).pipe(res);
            return;
        }

        const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        const fileStream = fs.createReadStream(videoPath, { start, end });

        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': mime.lookup(videoPath) || 'video/mp4',
        });

        fileStream.pipe(res);
    }

    public getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const input = req.query as IPaginationInput
            const data = await this.postService.getAllPost(input)
            res.sendJson(data)
        } catch (error) {
            logger.error(`PostController.getAll: `, error);
            next(error);
        }
    }

    public deletePost = async (req: Request, res: Response, next: NextFunction) => {

    }


}