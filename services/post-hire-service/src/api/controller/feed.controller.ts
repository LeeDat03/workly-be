import { USER_SERVICE_URL } from "@/common/enviroment";
import axios from "axios";
import { NextFunction, Request, Response } from "express";
import { IPostService } from "../service/post.service";
import { IPaginationInput } from "../model/common.model";
import { IJobService } from "../service/job.service";

export class FeedController {
	private postService: IPostService;
	private jobService: IJobService;

	constructor(postService: IPostService, jobService: IJobService) {
		this.postService = postService;
		this.jobService = jobService;
	}

	public getFeed = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const input = req.query as IPaginationInput;
			const userId = (req as any).user?.userId;

			// If user is not logged in, return a generic feed based on date and interactions
			if (!userId) {
				const data = await this.getPublicFeed(input);
				return res.sendJson(data);
			} else {
				const data = await this.getUserFeed(req, input, userId);
				return res.sendJson(data);
			}
		} catch (error) {
			next(error);
		}
	};

	private getPublicFeed = async (input: IPaginationInput) => {
		const data = await this.postService.getPublicFeed(input);

		const authorIds = data.data.map((post) => {
			return {
				id: post.author_id,
				type: post.author_type,
			};
		});

		const authorData = await axios
			.post(`${USER_SERVICE_URL}/internals/get-batch-ids`, {
				ids: authorIds,
			})
			.then((res) => res.data.data);

		const authorMap = new Map(
			authorData.map((item: any) => [item.id, item.data])
		);

		const postsWithAuthor = data.data.map((post) => ({
			...post,
			author: authorMap.get(post.author_id) || null,
		}));
		return {
			data: postsWithAuthor,
			pagination: data.pagination,
		};
	};

	private getUserFeed = async (
		req: Request,
		input: IPaginationInput,
		userId: string
	) => {
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
			.get(`${USER_SERVICE_URL}/internals/users/${userId}/feed-context`, {
				headers: {
					Cookie: req.headers.cookie,
					Authorization: req.headers.authorization,
				},
			})
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
		return {
			data: postsWithAuthor,
			pagination: data.pagination,
		};
	};

	///////////////////////////////////////////////////////////
	// JOBS
	public getJobFeed = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const input = req.query as IPaginationInput;
			const userId = (req as any).user?.userId;

			if (!userId) {
				const data = await this.getPublicJobFeed(input);
				return res.sendJson(data);
			} else {
				const data = await this.getUserJobFeed(req, input, userId);
				return res.sendJson(data);
			}
		} catch (error) {
			next(error);
		}
	};

	private getPublicJobFeed = async (input: IPaginationInput) => {
		const data = await this.jobService.getPublicJobFeed(input);

		return data;
	};

	private getUserJobFeed = async (
		req: Request,
		input: IPaginationInput,
		userId: string
	) => {
		const page = Number(input.page) || 1;
		const size = Number(input.size) || 10;

		const response: {
			data: {
				jobId: string;
				company: {
					id: string;
					name: string;
					imageUrl: string;
				};
				score: number;
			}[];
			pagination: {
				page: number;
				size: number;
				hasNextPage: boolean;
			};
		} = await axios
			.get(
				`${USER_SERVICE_URL}/internals/users/${userId}/job-context?page=${page}&size=${size}`,
				{
					headers: {
						Cookie: req.headers.cookie,
						Authorization: req.headers.authorization,
					},
				}
			)
			.then((res) => res.data);

		const targetMap = new Map<string, any>();
		response.data.forEach((item) => {
			targetMap.set(item.company.id, item.company);
		});

		const jobIds = response.data.map((item) => item.jobId);

		const data = await this.jobService.getJobsByIds(jobIds);

		const jobsWithCompany = data.map((job) => ({
			...job,
			company: targetMap.get(job.companyId) || null,
		}));

		return {
			data: jobsWithCompany,
			pagination: {
				page,
				size,
				hasNextPage: response.pagination.hasNextPage,
			},
		};
	};
}
