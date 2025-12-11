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
import {
	IPaginationInput,
	PagingList,
	PostSearch,
} from "../model/common.model";
import { TimeHelper } from "@/util/time.util";

export interface IPostRepository {
	createPost(post: CreatePostDTO): Promise<InsertOneResult>;
	getAll(): Promise<any[]>;
	updatePost(
		post: UpdatePostDTO,
	): Promise<UpdateResult>;
	getPostDetail(id: ObjectId): Promise<WithId<Document> | null>;
	getPagingPostByUserId(
		input: IPaginationInput,
		userId: string
	): Promise<PagingList<WithId<Document>>>;
	getPublicFeed(
		input: IPaginationInput
	): Promise<PagingList<WithId<Document>>>;
	deletePost(post: DeletePost): Promise<boolean>;
	getPostsByAuthorIds(
		input: IPaginationInput,
		authorIds: string[]
	): Promise<PagingList<WithId<Document>>>;
	getPagingPostSearch(
		keyword: string,
		page: number,
		size: number
	): Promise<PagingList<any>>
}

export class PostRepository implements IPostRepository {
	private postCollection: DatabaseAdapter;

	constructor(postCollection: DatabaseAdapter) {
		this.postCollection = postCollection;
	}

	public async deletePost(post: DeletePost): Promise<boolean> {
		const result = await this.postCollection.post.deleteOne({
			_id: new ObjectId(post.postId),
			author_id: post.author_id,
			author_type: post.author_type,
		});
		return result.deletedCount > 0;
	}

	public async createPost(post: CreatePostDTO): Promise<InsertOneResult> {
		const result = await this.postCollection.post.insertOne({
			...post,
			created_at: TimeHelper.now().format("YYYY-MM-DD HH:mm:ss"),
		});
		return result;
	}

	public async updatePost(
		post: UpdatePostDTO,
	): Promise<UpdateResult> {
		// Build update query with all changes
		const updateQuery: Record<string, any> = {};
		const filter = { 
			_id: new ObjectId(post.postId), 
			author_id: post.author_id, 
			author_type: post.author_type 
		};

		// Xóa media
		if (post.media_url_delete && post.media_url_delete.length > 0) {
			updateQuery.$pull = {
				media_url: {
					url: {
						$in: post.media_url_delete.map((i) => i.originalUrl) ?? [],
					},
				},
			};
		}

		// Thêm media
		if (post.media_url_add && post.media_url_add.length > 0) {
			if (updateQuery.$pull) {
				// Nếu đã có $pull, cần combine với $push
				updateQuery.$push = {
					media_url: { $each: [...(post.media_url_add || [])] },
				};
			} else {
				// Nếu chỉ có $push
				updateQuery.$push = {
					media_url: { $each: [...(post.media_url_add || [])] },
				};
			}
		}

		// Update nội dung khác (content, visibility, v.v.)
		const updateFields: any = {};
		if (post.content) updateFields.content = post.content;
		if (post.visibility) updateFields.visibility = post.visibility;

		if (Object.keys(updateFields).length > 0) {
			updateQuery.$set = updateFields;
		}

		// Thực hiện update trong một query duy nhất
		if (Object.keys(updateQuery).length > 0) {
			return await this.postCollection.post.updateOne(filter, updateQuery);
		}

		// Nếu không có gì để update, trả về result rỗng
		return {
			acknowledged: true,
			matchedCount: 0,
			modifiedCount: 0,
			upsertedCount: 0,
			upsertedId: null,
		} as UpdateResult;
	}

	public async getPostDetail(id: ObjectId): Promise<WithId<Document> | null> {
		return await this.postCollection.post.findOne({ _id: id });
	}

	public async getAll(): Promise<any[]> {
		const result = await this.postCollection.post
			.find()
			.sort({ createdAt: -1 })
			.toArray();
		return result;
	}
	public async getPagingPostSearch(
		keyword: string,
		page: number,
		size: number
	): Promise<PagingList<any>> {

		const skip = (page - 1) * size;

		const filter: any = {};

		if (keyword && keyword.trim() !== "") {
			filter.content = { $regex: keyword, $options: "i" };
		}

		const [data, total] = await Promise.all([
			this.postCollection.post
				.find(filter)
				.sort({ created_at: -1 })
				.skip(skip)
				.limit(size)
				.toArray(),

			this.postCollection.post.countDocuments(filter),
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

	public async getPagingPostByUserId(
		input: PostSearch,
		userId: string
	): Promise<PagingList<WithId<Document>>> {
		console.log(input);

		const page = Number(input.page) || 1;
		const size = Number(input.size) || 10;
		const skip = (page - 1) * size;

		// Filter chung cho query và count
		const filter = {
			author_id: userId,
			author_type: input.author_type
		};

		const [data, total] = await Promise.all([
			this.postCollection.post
				.find(filter)
				.sort({ created_at: -1 })
				.skip(skip)
				.limit(size)
				.toArray(),
			this.postCollection.post.countDocuments(filter),
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
	public async getPublicFeed(
		input: IPaginationInput
	): Promise<PagingList<WithId<Document>>> {
		const page = Number(input.page) || 1;
		const size = Number(input.size) || 10;
		const skip = (page - 1) * size;

		const [data, total] = await Promise.all([
			this.postCollection.post
				.find({})
				.sort({ created_at: -1 })
				.skip(skip)
				.limit(size)
				.toArray(),
			this.postCollection.post.countDocuments({}),
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
	public async getPostsByAuthorIds(
		input: IPaginationInput,
		authorIds: string[]
	): Promise<PagingList<WithId<Document>>> {
		const page = Number(input.page) ?? 1;
		const size = Number(input.size) ?? 10;
		const skip = (page - 1) * size;

		const [data, total] = await Promise.all([
			this.postCollection.post
				.find({
					author_id: { $in: authorIds },
				})
				.sort({ created_at: -1 })
				.skip(skip)
				.limit(size)
				.toArray(),
			this.postCollection.post.countDocuments({
				author_id: { $in: authorIds },
			}),
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
