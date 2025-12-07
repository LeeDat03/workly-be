import logger from "@/common/logger";
import { ISearchService } from "../service/search.service";
import { NextFunction, Request, Response } from "express";

export class SearchController {
    private searchService: ISearchService;
    constructor(searchService: ISearchService) {
        this.searchService = searchService;
    }
    public getGlobalSearch = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { keyword } = req.query;
            const cookie = req.headers.cookie;
            const authorization = req.headers.authorization;
            const userId = (req as any).user?.userId;
            const result = await this.searchService.getGlobalSearch(keyword as string, cookie as string, authorization as string, userId);
            res.sendJson(result);
        } catch (error) {
            logger.error(`PostController.create: `, error);
            next(error);
        }
    };
    public getJobSearch = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { search, skills, level, startDate, endDate, page, size } = req.query as any;
            const userId = (req as any).user?.userId;
            const result = await this.searchService.getJobSearch(userId, search, skills, level, startDate, endDate, page, size);
            res.sendJson(result);
        } catch (error) {
            logger.error(`PostController.create: `, error);
            next(error);
        }
    }
    public getCompanySearch = async (req: Request,
        res: Response,
        next: NextFunction) => {
        try {
            const { keyword, page, size } = req.query as any;
            const cookie = req.headers.cookie;
            const authorization = req.headers.authorization;
            const result = await this.searchService.getCompanySearch(keyword, page, size, cookie as string, authorization as string);
            res.sendJson(result);
        } catch (error) {
            logger.error(`PostController.create: `, error);
            next(error);
        }
    }
    public getUserSearch = async (req: Request,
        res: Response,
        next: NextFunction) => {
        try {
            const { keyword, page, size } = req.query as any;
            const cookie = req.headers.cookie;
            const authorization = req.headers.authorization;
            const result = await this.searchService.getUserSearch(keyword, page, size, cookie as string, authorization as string);
            res.sendJson(result);
        } catch (error) {
            logger.error(`PostController.create: `, error);
            next(error);
        }
    }
    public getPostSearch = async (req: Request,
        res: Response,
        next: NextFunction) => {
        try {
            const { keyword, page, size } = req.query as any;
            const result = await this.searchService.getPostSearch(keyword, Number(page), Number(size));
            res.sendJson(result);
        } catch (error) {
            logger.error(`PostController.create: `, error);
            next(error);
        }
    }
}
