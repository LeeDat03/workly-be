import { IBookmarkRepository } from "@/api/repository/bookmark.repository";
import {
	BookmarkResponse,
	BookmarkType,
	CreateBookmarkDTO,
	DeleteBookmarkDTO,
} from "@/api/model/bookmark.model";
import { APIError } from "@/common/error/api.error";
import { StatusCode } from "@/common/errors";

export interface IBookmarkService {
	bookmarkItem(dto: CreateBookmarkDTO): Promise<BookmarkResponse>;
	unbookmarkItem(dto: DeleteBookmarkDTO): Promise<boolean>;
	getUserBookmarks(
		userId: string,
		type?: BookmarkType
	): Promise<BookmarkResponse[]>;
	getBookmarkStatus(
		userId: string,
		itemId: string,
		type: BookmarkType
	): Promise<boolean>;
	getBookmarksByItemIds(
		itemIds: string[],
		type: BookmarkType,
		userId: string
	): Promise<Record<string, boolean>>;
}

export class BookmarkService implements IBookmarkService {
	private bookmarkRepository: IBookmarkRepository;

	constructor(bookmarkRepository: IBookmarkRepository) {
		this.bookmarkRepository = bookmarkRepository;
	}

	public bookmarkItem = async (
		dto: CreateBookmarkDTO
	): Promise<BookmarkResponse> => {
		try {
			const result = await this.bookmarkRepository.bookmarkItem(dto);
			if (!result.acknowledged || !result.insertedId) {
				throw new APIError({
					message: "Failed to bookmark item",
					status: StatusCode.SERVER_ERROR,
				});
			}

			// Return bookmark response directly from inserted data
			return {
				_id: result.insertedId.toString(),
				userId: dto.userId,
				itemId: dto.itemId,
				type: dto.type,
				createdAt: new Date().toISOString(),
			};
		} catch (error: any) {
			if (error.message === "Item already bookmarked") {
				throw new APIError({
					message: error.message,
					status: StatusCode.BAD_REQUEST,
				});
			}
			throw error;
		}
	};

	public unbookmarkItem = async (
		dto: DeleteBookmarkDTO
	): Promise<boolean> => {
		const result = await this.bookmarkRepository.unbookmarkItem(dto);
		if (!result) {
			throw new APIError({
				message: "Bookmark not found",
				status: StatusCode.REQUEST_NOT_FOUND,
			});
		}
		return result;
	};

	public getUserBookmarks = async (
		userId: string,
		type?: BookmarkType
	): Promise<BookmarkResponse[]> => {
		return await this.bookmarkRepository.getBookmarksByUser(userId, type);
	};

	public getBookmarkStatus = async (
		userId: string,
		itemId: string,
		type: BookmarkType
	): Promise<boolean> => {
		return await this.bookmarkRepository.getBookmarkStatus(
			userId,
			itemId,
			type
		);
	};

	public getBookmarksByItemIds = async (
		itemIds: string[],
		type: BookmarkType,
		userId: string
	): Promise<Record<string, boolean>> => {
		// Get all bookmarks for these items by this user
		const userBookmarks = await this.bookmarkRepository.getBookmarksByUser(
			userId,
			type
		);
		const userBookmarkIds = new Set(userBookmarks.map((b) => b.itemId));

		const result: Record<string, boolean> = {};
		itemIds.forEach((id) => {
			result[id] = userBookmarkIds.has(id);
		});

		return result;
	};
}
