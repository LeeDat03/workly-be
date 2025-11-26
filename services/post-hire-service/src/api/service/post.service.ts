import { IPostRepository } from "@/api/repository/post.repository";
import {
	CreatePostDTO,
	DeletePost,
	mapToPostResponse,
	MediaItem,
	MediaType,
	Post,
	PostResponse,
	UpdatePostDTO,
} from "@/api/model/post.model";
import {
	Document,
	InsertOneResult,
	ObjectId,
	UpdateResult,
	WithId,
} from "mongodb";
import path from "path";
import { FileUtil } from "@/util/fileUtil";
import { APIError } from "@/common/error/api.error";
import { StatusCode } from "@/common/errors";
import {
	IPaginationInput,
	JobPost,
	PagingList,
} from "@/api/model/common.model";
import {
	HOME_ACCOUNT_POST_KEY,
	ADD_POST_JOB as JOB_NAME,
} from "@/config/job.constant";
import { QueueService } from "@/api/service/queue.service";
import { RedisAdapter } from "@/common/infrastructure/redis.adapter";
import { ICommentRepository } from "../repository/comment.repository";
import { ILikeRepository } from "../repository/like.repository";

export interface IPostService {
	createPost(post: CreatePostDTO): Promise<InsertOneResult>;
	getAllFileMedia(): Promise<string[]>;
	updatePost(post: UpdatePostDTO, id: ObjectId, userId: ObjectId): Promise<UpdateResult>;
	getPostDetail(id: ObjectId): Promise<PostResponse>;
	getAllPost(
		input: IPaginationInput,
		userId: string,
	): Promise<PagingList<PostResponse>>;
	deletePost(
		post: DeletePost
	): Promise<Boolean>

}

export class PostService implements IPostService {
	private postRepository: IPostRepository;
	private commentRepository: ICommentRepository;
	private likeRepository: ILikeRepository

	constructor(postRepository: IPostRepository, commentRepository: ICommentRepository, likeRepository: ILikeRepository) {
		this.postRepository = postRepository;
		this.commentRepository = commentRepository;
		this.likeRepository = likeRepository
	}

	public deletePost = async (
		post: DeletePost
	): Promise<Boolean> => {
		const result = await this.postRepository.deletePost(post);
		if (!result) {
			throw new APIError({ message: "post.notfound", status: StatusCode.REQUEST_NOT_FOUND });
		}
		return result;
	};

	public createPost = async (
		post: CreatePostDTO
	): Promise<InsertOneResult> => {
		const result = await this.postRepository.createPost(post);
		//add in to post_job
		// const queue = await QueueService.getQueue<JobPost>(JOB_NAME);
		// queue.add(
		// 	{ postId: result.insertedId },
		// 	{ removeOnComplete: true, removeOnFail: true }
		// );

		return result;
	};

	public updatePost = async (
		post: UpdatePostDTO,
		id: ObjectId,
		userId: ObjectId
	): Promise<UpdateResult> => {
		const postExisted = await this.postRepository.getPostDetail(id);
		if (!postExisted) {
			throw new APIError({
				message: "post.notfound",
				status: StatusCode.BAD_REQUEST,
			});
		}
		const cacheKey = `${HOME_ACCOUNT_POST_KEY}${userId}`;
		const result = await this.postRepository.updatePost(post, id, userId);
		await RedisAdapter.deleteKeysWithPrefix(cacheKey);

		// delete old file
		if (post.media_url?.delete && post.media_url.delete.length > 0) {
			post.media_url.delete.forEach((item: MediaItem) => {
				const TARGET_DIR =
					item.type === MediaType.IMAGE
						? path.resolve(
							__dirname,
							"../../../uploads/posts/images"
						)
						: path.resolve(
							__dirname,
							"../../../uploads/posts/videos"
						);
				const fullPath = path.join(TARGET_DIR, item.url);
				FileUtil.deleteFilePath(fullPath);
			});
		}

		return result;
	};

	public getPostDetail = async (id: ObjectId): Promise<PostResponse> => {
		const post = await this.postRepository.getPostDetail(id);
		if (!post) {
			throw new APIError({
				message: "post.notfound",
				status: StatusCode.BAD_REQUEST,
			});
		}

		return mapToPostResponse(post);
	};
	public getAllPost = async (
		input: IPaginationInput,
		userId: string
	): Promise<PagingList<PostResponse>> => {
		// Lấy danh sách post
		const result = await this.postRepository.getPagingPostByUserId(
			input,
			userId
		);


		// Lấy postIds để query comment
		const postIds = result.data.map((post) => post._id.toString());

		// Đếm comment cho từng post
		const commentCounts = await this.commentRepository.countCommentsByPostIds(postIds);
		const likePosts = await this.likeRepository.getAllLikeByListPost(postIds)
		// Map data với số lượng comment
		const mappedData = result.data.map((item) => {
			const postResponse = mapToPostResponse(item);
			return {
				...postResponse,
				totalComments: commentCounts[item._id.toString()] || 0,
				totalLikes: likePosts[item._id.toString()] || [],
			};
		});


		return {
			...result,
			data: mappedData,
		};
	};
	// public getAllPost = async (
	// 	input: IPaginationInput,
	// 	userId: string
	// ): Promise<PagingList<PostResponse>> => {
	// 	// const cacheKey = `${HOME_ACCOUNT_POST_KEY}${userId}${input.page}`;
	// 	let result: PagingList<WithId<Document>>;
	// 	// result = (await RedisAdapter.get(cacheKey)) as PagingList<
	// 	// 	WithId<Document>
	// 	// >;
	// 	// console.log("map1", result.data);
	// 	result = await this.postRepository.getPagingPostByUserId(
	// 		input,
	// 		userId
	// 	);
	// 	// if (!result) {
	// 	// 	result = await this.postRepository.getPagingPostByUserId(
	// 	// 		input,
	// 	// 		userId
	// 	// 	);
	// 	// 	console.log("map", result.data);

	// 	// 	await RedisAdapter.set(cacheKey, result, 36000);
	// 	// }
	// 	const mappedData = result.data.map((item) => {
	// 		return mapToPostResponse(item);
	// 	})

	// 	return {
	// 		...result,
	// 		data: mappedData,
	// 	};
	// };

	public getAllFileMedia = async (): Promise<string[]> => {
		const posts = await this.postRepository.getAll();
		const mediaFiles = new Array();
		posts.forEach((item: Post) => {
			item.media_url.forEach((item: MediaItem) => {
				mediaFiles.push(item.url);
			});
		});
		return mediaFiles;
	};
}
