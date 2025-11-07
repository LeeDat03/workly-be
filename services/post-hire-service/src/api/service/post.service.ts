import { IPostRepository } from "@/api/repository/post.repository";
import {
	CreatePostDTO,
	mapToPostResponse,
	MediaItem,
	MediaType,
	Post,
	PostResponse,
	UpdatePostDTO,
} from "@/api/model/post.model";
import { InsertOneResult, ObjectId, UpdateResult } from "mongodb";
import path from "path";
import { FileUtil } from "@/util/fileUtil";
import { APIError } from "@/common/error/api.error";
import { StatusCode } from "@/common/errors";
import {
	IPaginationInput,
	JobPost,
	PagingList,
} from "@/api/model/common.model";
import { ADD_POST_JOB as JOB_NAME } from "@/config/job.constant";
import { QueueService } from "@/api/service/queue.service";

export interface IPostService {
	createPost(post: CreatePostDTO): Promise<InsertOneResult>;
	getAllFileMedia(): Promise<string[]>;
	updatePost(post: UpdatePostDTO, id: ObjectId): Promise<UpdateResult>;
	getPostDetail(id: ObjectId): Promise<PostResponse>;
	getAllPost(
		input: IPaginationInput,
		userId: ObjectId
	): Promise<PagingList<PostResponse>>;
}

export class PostService implements IPostService {
	private postRepository: IPostRepository;

	constructor(postRepository: IPostRepository) {
		this.postRepository = postRepository;
	}

	public createPost = async (
		post: CreatePostDTO
	): Promise<InsertOneResult> => {
		const result = await this.postRepository.createPost(post);
		//add in to post_job
		const queue = await QueueService.getQueue<JobPost>(JOB_NAME);
		queue.add(
			{ postId: result.insertedId },
			{ removeOnComplete: true, removeOnFail: true }
		);

		return result;
	};

	public updatePost = async (
		post: UpdatePostDTO,
		id: ObjectId
	): Promise<UpdateResult> => {
		const postExisted = await this.postRepository.getPostDetail(id);
		if (!postExisted) {
			throw new APIError({
				message: "post.notfound",
				status: StatusCode.BAD_REQUEST,
			});
		}

		const result = await this.postRepository.updatePost(post, id);

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
		userId: ObjectId
	): Promise<PagingList<PostResponse>> => {
		const result = await this.postRepository.getPagingPostByUserId(
			input,
			userId
		);
		const mappedData = result.data.map((item) => {
			return mapToPostResponse(item);
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
}
