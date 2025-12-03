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
import mqManager from "@/common/infrastructure/mq.adapter";
import { QUEUES, sendEventAddPost } from "./mq.service";

export interface IPostService {
	createPost(post: CreatePostDTO): Promise<InsertOneResult>;
	getAllFileMedia(): Promise<string[]>;
	updatePost(updatePost: UpdatePostDTO): Promise<UpdateResult>;
	getPostDetail(id: ObjectId): Promise<PostResponse>;
	getPublicFeed(
		input: IPaginationInput,
	): Promise<PagingList<PostResponse>>;
	getAllPost(
		input: IPaginationInput,
		userId: string,
	): Promise<PagingList<PostResponse>>;
	deletePost(
		post: DeletePost
	): Promise<Boolean>;
	getPostsByAuthorIds(
		input: IPaginationInput,
		authorIds: string[]
	): Promise<PagingList<PostResponse>>;

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
		if (result.acknowledged && result.insertedId) {
			sendEventAddPost({ type: "ADD", postId: result.insertedId })
		}
		return result;
	};

	public updatePost = async (
		updatePost: UpdatePostDTO
	): Promise<UpdateResult> => {
		const postExisted = await this.postRepository.getPostDetail(new ObjectId(updatePost.postId));
		if (!postExisted) {
			throw new APIError({
				message: "post.notfound",
				status: StatusCode.BAD_REQUEST,
			});
		}
		const result = await this.postRepository.updatePost(updatePost);

		// delete old file
		if (updatePost.media_url_delete && updatePost.media_url_delete.length > 0) {
			updatePost.media_url_delete.forEach((item: any) => {
				const TARGET_DIR =
					item.originalType === MediaType.IMAGE
						? path.resolve(
							__dirname,
							"../../../uploads/posts/images"
						)
						: path.resolve(
							__dirname,
							"../../../uploads/posts/videos"
						);
				const fullPath = path.join(TARGET_DIR, item.originalUrl);
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
	public getPublicFeed = async (
		input: IPaginationInput,
	): Promise<PagingList<PostResponse>> => {
		const result = await this.postRepository.getPublicFeed(input);

		const postIds = result.data.map((post) => post._id.toString());

		const commentCounts = await this.commentRepository.countCommentsByPostIds(postIds);
		const likePosts = await this.likeRepository.getAllLikeByListPost(postIds);
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
	public getAllPost = async (
		input: IPaginationInput,
		userId: string
	): Promise<PagingList<PostResponse>> => {
		// Lấy danh sách post
		const result = await this.postRepository.getPagingPostByUserId(
			input,
			userId
		);
		const postIds = result.data.map((post) => post._id.toString());

		const commentCounts = await this.commentRepository.countCommentsByPostIds(postIds);
		const likePosts = await this.likeRepository.getAllLikeByListPost(postIds)
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

	public getPostsByAuthorIds = async (
		input: IPaginationInput,
		authorIds: string[]
	): Promise<PagingList<PostResponse>> => {
		const result = await this.postRepository.getPostsByAuthorIds(input, authorIds);

		const postIds = result.data.map((post) => post._id.toString());

		const commentCounts = await this.commentRepository.countCommentsByPostIds(postIds);
		const likePosts = await this.likeRepository.getAllLikeByListPost(postIds)
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
}
