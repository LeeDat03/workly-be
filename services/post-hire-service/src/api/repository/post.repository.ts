import {
	CreatePostDTO,
	DeletePost,
	Post,
	PostResponse,
	UpdatePostDTO,
} from "@/api/model/post.model";
import { DatabaseAdapter } from "@/common/infrastructure/database.adapter";
import {
	Document,
	InsertOneResult,
	ObjectId,
	UpdateResult,
	WithId,
} from "mongodb";
import { IPaginationInput, PagingList, PostSearch } from "../model/common.model";
import { TimeHelper } from "@/util/time.util";

export interface IPostRepository {
	createPost(post: CreatePostDTO): Promise<InsertOneResult>;
	getAll(): Promise<any[]>;
	updatePost(
		post: UpdatePostDTO,
		id: ObjectId,
		userId: ObjectId
	): Promise<UpdateResult>;
	getPostDetail(id: ObjectId): Promise<WithId<Document> | null>;
	getPagingPostByUserId(
		input: IPaginationInput,
		userId: string
	): Promise<PagingList<WithId<Document>>>;
	deletePost(post: DeletePost): Promise<boolean>
}

export class PostRepository implements IPostRepository {
	private postCollection: DatabaseAdapter;

	constructor(postCollection: DatabaseAdapter) {
		this.postCollection = postCollection;
	}

	public async deletePost(post: DeletePost): Promise<boolean> {
		const result = await this.postCollection.post.deleteOne({ _id: new ObjectId(post.postId), author_id: post.author_id, author_type: post.author_type });
		return result.deletedCount > 0;
	}

	public async createPost(post: CreatePostDTO): Promise<InsertOneResult> {
		const result = await this.postCollection.post.insertOne({ ...post, created_at: TimeHelper.now().format('YYYY-MM-DD HH:mm:ss') });
		return result;
	}

	public async updatePost(
		post: UpdatePostDTO,
		id: ObjectId,
		userId: ObjectId
	): Promise<UpdateResult> {
		return await this.postCollection.withTransaction(async (session) => {
			let result;
			const updatePushQuery: Record<string, any> = {
				$push: {
					media_url: { $each: [...(post.media_url?.add || [])] },
				},
			};
			const updatePullQuery: Record<string, any> = {
				$pull: {
					media_url: {
						url: {
							$in:
								post.media_url?.delete?.map((i) => i.url) ?? [],
						},
					},
				},
			};

			// Xóa media
			if (post.media_url?.delete?.length) {
				result = await this.postCollection.post.updateOne(
					{ _id: id, author_id: userId },
					updatePullQuery,
					{ session }
				);
			}

			// Thêm media
			if (post.media_url?.add?.length) {
				result = await this.postCollection.post.updateOne(
					{ _id: id, author_id: userId },
					updatePushQuery,
					{ session }
				);
			}

			// Update nội dung khác (content, visibility, v.v.)
			const updateFields: any = {};
			if (post.content) updateFields.content = post.content;
			if (post.visibility) updateFields.visibility = post.visibility;

			if (Object.keys(updateFields).length > 0) {
				result = await this.postCollection.post.updateOne(
					{ _id: id, author_id: userId },
					{ $set: updateFields },
					{ session }
				);
			}
		});
	}

	public async getPostDetail(id: ObjectId): Promise<WithId<Document> | null> {
		return await this.postCollection.post.findOne({ _id: id });
	}

	public async getAll(): Promise<any[]> {
		const result = await this.postCollection.post.find().sort({ createdAt: -1 }).toArray();
		return result;
	}

	public async getPagingPostByUserId(
		input: PostSearch,
		userId: string
	): Promise<PagingList<WithId<Document>>> {
		const page = Number(input.page) ?? 1;
		const size = Number(input.size) ?? 10;
		const skip = (page - 1) * size;
		const [data, total] = await Promise.all([
			this.postCollection.post
				.find({ author_id: userId, author_type: input.author_type })
				.sort({ created_at: -1 })
				.skip(skip)
				.limit(size)
				.toArray(),
			this.postCollection.post.countDocuments(),
		]);

		return {
			data,
			pagination: {
				page,
				size,
				total,
				totalPages: Math.ceil(total / size),
			},
		};
	}
}
