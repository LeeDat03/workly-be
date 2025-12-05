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
            console.log("debug");

            const result = await this.searchService.getGlobalSearch(keyword as string);
            res.sendJson(result);
        } catch (error) {
            logger.error(`PostController.create: `, error);
            next(error);
        }
    };
}
