import { NextFunction, Request, Response } from "express";
import { IBookmarkService } from "../service/bookmark.service";
import logger from "@/common/logger";
import { BookmarkType } from "../model/bookmark.model";

export class BookmarkController {
	private bookmarkService: IBookmarkService;

	constructor(bookmarkService: IBookmarkService) {
		this.bookmarkService = bookmarkService;
	}

	public bookmarkItem = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const { itemId, type } = req.body;
			const userId = req.user!!.userId;

			if (!itemId || !type) {
				return res.status(400).json({
					errorCode: 1,
					message: "itemId and type are required",
				});
			}

			if (!Object.values(BookmarkType).includes(type)) {
				return res.status(400).json({
					errorCode: 1,
					message: "Invalid bookmark type",
				});
			}

			const result = await this.bookmarkService.bookmarkItem({
				userId,
				itemId,
				type: type as BookmarkType,
			});

			res.sendJson(result);
		} catch (error) {
			logger.error(`BookmarkController.bookmarkItem: `, error);
			next(error);
		}
	};

	public unbookmarkItem = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const { itemId, type } = req.body;
			const userId = req.user!!.userId;

			if (!itemId || !type) {
				return res.status(400).json({
					errorCode: 1,
					message: "itemId and type are required",
				});
			}

			const result = await this.bookmarkService.unbookmarkItem({
				userId,
				itemId,
				type: type as BookmarkType,
			});

			res.sendJson(result);
		} catch (error) {
			logger.error(`BookmarkController.unbookmarkItem: `, error);
			next(error);
		}
	};

	public getUserBookmarks = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const userId = req.user!!.userId;
			const type = req.query.type as BookmarkType | undefined;

			const result = await this.bookmarkService.getUserBookmarks(userId, type);
			res.sendJson(result);
		} catch (error) {
			logger.error(`BookmarkController.getUserBookmarks: `, error);
			next(error);
		}
	};

	public getBookmarkStatus = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const { itemId, type } = req.query;
			const userId = req.user!!.userId;

			if (!itemId || !type) {
				return res.status(400).json({
					errorCode: 1,
					message: "itemId and type are required",
				});
			}

			const result = await this.bookmarkService.getBookmarkStatus(
				userId,
				itemId as string,
				type as BookmarkType
			);

			res.sendJson({ isBookmarked: result });
		} catch (error) {
			logger.error(`BookmarkController.getBookmarkStatus: `, error);
			next(error);
		}
	};
}

