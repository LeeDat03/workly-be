import {
	CreatePostDTO,
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
import { IPaginationInput, PagingList } from "../model/common.model";

export interface IPostRepository {
	createPost(post: CreatePostDTO): Promise<InsertOneResult>;
	getAll(): Promise<any[]>;
	updatePost(post: UpdatePostDTO, id: ObjectId): Promise<UpdateResult>;
	getPostDetail(id: ObjectId): Promise<WithId<Document> | null>;
	getPagingPostByUserId(
		input: IPaginationInput,
		userId: ObjectId
	): Promise<PagingList<WithId<Document>>>;
}

export class PostRepository implements IPostRepository {
	private postCollection: DatabaseAdapter;

	constructor(postCollection: DatabaseAdapter) {
		this.postCollection = postCollection;
	}

	public async createPost(post: CreatePostDTO): Promise<InsertOneResult> {
		const result = await this.postCollection.post.insertOne(post);
		return result;
	}

	public async updatePost(
		post: UpdatePostDTO,
		id: ObjectId
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
					{ _id: id },
					updatePullQuery,
					{ session }
				);
			}

			// Thêm media
			if (post.media_url?.add?.length) {
				result = await this.postCollection.post.updateOne(
					{ _id: id },
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
					{ _id: id },
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
		const result = await this.postCollection.post.find().toArray();
		return result;
	}

	public async getPagingPostByUserId(
		input: IPaginationInput,
		userId: ObjectId
	): Promise<PagingList<WithId<Document>>> {
		const page = input.page ?? 1;
		const size = input.size ?? 10;
		const skip = (page - 1) * size;
		const [data, total] = await Promise.all([
			this.postCollection.post
				.find({ author_id: userId })
				.sort({ createdAt: -1 })
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
