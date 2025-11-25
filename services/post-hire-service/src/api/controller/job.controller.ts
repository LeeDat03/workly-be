import { NextFunction, Request, Response } from "express";
import logger from "@/common/logger";
import { IJobService } from "../service/job.service";
import { JobSearch } from "../model/common.model";

export class JobController {
    private jobService: IJobService;

    constructor(jobService: IJobService) {
        this.jobService = jobService;
    }
    public getJobsByCompanyId = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const input = req.query as unknown as JobSearch;
            console.log(input);

            const data = await this.jobService.getAllJob(
                input
            );
            res.sendJson(data)
        } catch (error) {
            logger.error(`JobController.create: `, error);
            next(error);
        }
    };
}