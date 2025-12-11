import { DatabaseAdapter } from "@/common/infrastructure/database.adapter";
import { TimeHelper } from "@/util/time.util";
import { InsertOneResult } from "mongodb/mongodb";
import { BookmarkResponse, BookmarkType, CreateBookmarkDTO, DeleteBookmarkDTO } from "../model/bookmark.model";

export interface IBookmarkRepository {
	bookmarkItem(dto: CreateBookmarkDTO): Promise<InsertOneResult>;
	unbookmarkItem(dto: DeleteBookmarkDTO): Promise<boolean>;
	getBookmarksByUser(userId: string, type?: BookmarkType): Promise<BookmarkResponse[]>;
	getBookmarkStatus(userId: string, itemId: string, type: BookmarkType): Promise<boolean>;
	getBookmarksByItemIds(itemIds: string[], type: BookmarkType): Promise<Record<string, boolean>>;
}

export class BookmarkRepository implements IBookmarkRepository {
	private bookmarkCollection: DatabaseAdapter;

	constructor(bookmarkCollection: DatabaseAdapter) {
		this.bookmarkCollection = bookmarkCollection;
	}

	public bookmarkItem = async (dto: CreateBookmarkDTO): Promise<InsertOneResult> => {
		// Check if already bookmarked
		const existing = await this.bookmarkCollection.bookmark.findOne({
			userId: dto.userId,
			itemId: dto.itemId,
			type: dto.type,
		});

		if (existing) {
			throw new Error("Item already bookmarked");
		}

		return await this.bookmarkCollection.bookmark.insertOne({
			userId: dto.userId,
			itemId: dto.itemId,
			type: dto.type,
			createdAt: TimeHelper.now().format('YYYY-MM-DD HH:mm:ss'),
		});
	};

	public unbookmarkItem = async (dto: DeleteBookmarkDTO): Promise<boolean> => {
		const result = await this.bookmarkCollection.bookmark.deleteOne({
			userId: dto.userId,
			itemId: dto.itemId,
			type: dto.type,
		});
		return result.deletedCount > 0;
	};

	public getBookmarksByUser = async (userId: string, type?: BookmarkType): Promise<BookmarkResponse[]> => {
		const filter: any = { userId };
		if (type) {
			filter.type = type;
		}
		return await this.bookmarkCollection.bookmark
			.find<BookmarkResponse>(filter)
			.sort({ createdAt: -1 })
			.toArray();
	};

	public getBookmarkStatus = async (userId: string, itemId: string, type: BookmarkType): Promise<boolean> => {
		const bookmark = await this.bookmarkCollection.bookmark.findOne({
			userId,
			itemId,
			type,
		});
		return !!bookmark;
	};

	public getBookmarksByItemIds = async (
		itemIds: string[],
		type: BookmarkType
	): Promise<Record<string, boolean>> => {
		const bookmarks = await this.bookmarkCollection.bookmark
			.find<BookmarkResponse>({
				itemId: { $in: itemIds },
				type,
			})
			.toArray();

		const bookmarkMap: Record<string, boolean> = {};
		itemIds.forEach((id) => {
			bookmarkMap[id] = false;
		});

		bookmarks.forEach((bookmark) => {
			bookmarkMap[bookmark.itemId] = true;
		});

		return bookmarkMap;
	};
}

