import { NextFunction, Request, Response } from "express";
import { IPostService } from "@/api/service/post.service";
import logger from "@/common/logger";
import { AuthorType, Company, CreatePostDTO, DeletePost, PostResponse, UpdatePostDTO, User } from "@/api/model/post.model";
import { ObjectId } from "mongodb";
import { IPaginationInput, PagingList, PostSearch } from "../model/common.model";

import path from "path";
import fs from "fs";
import axios from "axios";

export class PostController {
	private postService: IPostService;

	constructor(postService: IPostService) {
		this.postService = postService;
	}

	public createPost = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const body = req.body as CreatePostDTO;
			const result = await this.postService.createPost(body);
			res.sendJson(result);
		} catch (error) {
			logger.error(`PostController.create: `, error);
			next(error);
		}
	};
	public deletePost = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const body = req.body as DeletePost;
			console.log(req.body);

			const result = await this.postService.deletePost(body);
			res.sendJson(result);
		} catch (error) {
			logger.error(`PostController.delete: `, error);
			next(error);
		}
	};


	public uploadFile = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const data = req.file;

			res.sendJson(data);
		} catch (error) {
			logger.error("PostController.uploadFile", error);
			next(error);
		}
	};
	public updatePost = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const body = req.body as UpdatePostDTO;
			const result = await this.postService.updatePost(body);
			res.sendJson(result);
		} catch (error) {
			logger.error("PostController.updatePost", error);
			next(error);
		}
	};

	public getPostDetail = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const objectId = new ObjectId(req.params.id);
			const result = await this.postService.getPostDetail(objectId);
			res.sendJson(result);
		} catch (error) {
			logger.error("PostController.updatePost", error);
			next(error);
		}
	};

	public getStreamVideo = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		console.log("streaming....");

		const videoPath = path.join(
			__dirname,
			"../../../uploads/videos",
			req.params.filename
		);

		if (!fs.existsSync(videoPath)) {
			return res.status(404).send("Video not found");
		}

		const fileSize = fs.statSync(videoPath).size;
		const range = req.headers.range;
		if (!range) {
			// Không có range => gửi toàn bộ video
			res.writeHead(200, {
				"Content-Length": fileSize,
				"Content-Type": "video/mp4",
				"Access-Control-Allow-Origin": "*",
			});
			fs.createReadStream(videoPath).pipe(res);
			return;
		}

		const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
		const start = parseInt(startStr, 10);
		const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
		const chunkSize = end - start + 1;

		const fileStream = fs.createReadStream(videoPath, { start, end });

		res.writeHead(206, {
			"Content-Range": `bytes ${start}-${end}/${fileSize}`,
			"Accept-Ranges": "bytes",
			"Content-Length": chunkSize,
			"Content-Type": "video/mp4",
			"Access-Control-Allow-Origin": "*",
		});

		fileStream.pipe(res);
	};

	public getPostByUserId = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const input = req.query as PostSearch;
			const data = await this.postService.getAllPost(
				input,
				req.query.userId as string
			);
			console.log(input.author_type);

			const userIds = data.data.map(post => post.author_id);
			if (userIds.length === 0) {
				return res.sendJson(data);
			}

			if (input.author_type === "USER") {
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

				const usersMap = new Map(response.data.data.map((user: any) => [user.userId, { id: user.userId, name: user.name, imageUrl: user.avatarUrl }]));
				const postsWithAuthor = data.data.map(post => ({
					...post,
					author: usersMap.get(post.author_id) || null
				}));

				res.sendJson({ data: postsWithAuthor, pagination: data.pagination });

			}
			if (input.author_type === "COMPANY") {

				const response = await axios.post(
					`http://localhost:8003/api/v1/internals/companies/get-batch`,
					{ companyIds: userIds },
					{
						headers: {
							Cookie: req.headers.cookie,
							Authorization: req.headers.authorization,
						},
						withCredentials: true,
					}
				);

				const companiesMap = new Map(response.data.data.map((company: Company) => [company.companyId, { id: company.companyId, name: company.name, imageUrl: company.logoUrl }]));
				const postsWithAuthor = data.data.map(post => ({
					...post,
					author: companiesMap.get(post.author_id) || null
				}));

				res.sendJson({ data: postsWithAuthor, pagination: data.pagination });

			}
		} catch (error) {
			logger.error(`PostController.getAll: `, error);
			next(error);
		}
	};
}
