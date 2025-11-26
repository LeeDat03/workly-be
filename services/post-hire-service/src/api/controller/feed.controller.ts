import { USER_SERVICE_URL } from "@/common/enviroment";
import axios from "axios";
import { NextFunction, Request, Response } from "express";
import { IPostService } from "../service/post.service";
import { IPaginationInput } from "../model/common.model";

export class FeedController {
	private postService: IPostService;

	constructor(postService: IPostService) {
		this.postService = postService;
	}

	public getFeed = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const input = req.query as IPaginationInput;
			const userId = req.user!!.userId;
			const targetMap = new Map<string, any>();

			const response: {
				data: {
					target: {
						id: string;
						name: string;
						imageUrl: string;
						headline?: string;
					};
					type: string;
					score: number;
				}[];
			} = await axios
				.get(
					`${USER_SERVICE_URL}/internals/users/${userId}/feed-context`,
					{
						headers: {
							Cookie: req.headers.cookie,
							Authorization: req.headers.authorization,
						},
					}
				)
				.then((res) => res.data);

			response.data.forEach((item) => {
				targetMap.set(item.target.id, item.target);
			});
			const data = await this.postService.getPostsByAuthorIds(
				input,
				Array.from(targetMap.keys())
			);

			const postsWithAuthor = data.data.map((post) => ({
				...post,
				author: targetMap.get(post.author_id) || null,
			}));

			res.sendJson({
				data: postsWithAuthor,
				pagination: data.pagination,
			});
		} catch (error) {
			next(error);
		}
	};
}
