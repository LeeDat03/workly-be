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

		let authorData;
		try {
			authorData = await axios
				.post(`${USER_SERVICE_URL}/internals/get-batch-ids`, {
					ids: authorIds,
				})
				.then((res) => res.data.data);
		} catch (error) {
			console.log("error get author data", error);
			authorData = [];
		}

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

		let response: {
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
		};
		try {
			response = await axios
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
		} catch (error) {
			console.log("error get feed context", error);
			response = { data: [] };
		}

		response.data.forEach((item) => {
			targetMap.set(item.target.id, item.target);
		});

		// If user doesn't have any target users to follow, return public feed
		if (targetMap.size === 0) {
			return await this.getPublicFeed(input);
		}

		const data = await this.postService.getPostsByAuthorIds(
			input,
			Array.from(targetMap.keys())
		);

		// If no posts found from followed users, fallback to public feed
		if (data.data.length === 0) {
			return await this.getPublicFeed(input);
		}

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

		const mapPagination = {
			page: data.pagination.page,
			size: data.pagination.size,
			hasNextPage: data.pagination.page < data.pagination.totalPages,
		};

		const companyIds = data.data.map((job) => job.companyId);
		let companyData;
		try {
			companyData = await axios
				.post(`${USER_SERVICE_URL}/internals/companies/get-batch`, {
					companyIds: companyIds,
				})
				.then((res) => res.data.data);
		} catch (error) {
			console.log("error get company data", error);
			companyData = [];
		}

		const companyMap = new Map(
			companyData.map((item: any) => [
				item.companyId,
				{
					...item,
					id: item.companyId,
				},
			])
		);

		const jobsWithCompany = data.data.map((job) => ({
			...job,
			company: companyMap.get(job.companyId) || null,
		}));

		return {
			data: jobsWithCompany,
			pagination: mapPagination,
		};
	};

	private getUserJobFeed = async (
		req: Request,
		input: IPaginationInput,
		userId: string
	) => {
		const page = Number(input.page) || 1;
		const size = Number(input.size) || 10;

		let response: {
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
		};

		try {
			response = await axios
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
		} catch (error) {
			console.log("error get job context", error);
			response = {
				data: [],
				pagination: { page: 1, size: 10, hasNextPage: false },
			};
		}

		if (!response.data || response.data.length === 0) {
			return await this.getPublicJobFeed(input);
		}

		const targetMap = new Map<string, any>();
		response.data.forEach((item) => {
			targetMap.set(item.company.id, item.company);
		});

		const jobIds = response.data.map((item) => item.jobId);

		// If user doesn't have any recommended jobs, return public feed
		if (jobIds.length === 0) {
			return await this.getPublicJobFeed(input);
		}

		const data = await this.jobService.getJobsByIds(userId, jobIds);

		// If no jobs found from recommendations, fallback to public feed
		if (data.length === 0) {
			return await this.getPublicJobFeed(input);
		}

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
