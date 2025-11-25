import { NextFunction, Request, Response } from "express";
import logger from "@/common/logger";
import { IJobService } from "../service/job.service";
import { JobSearch } from "../model/common.model";
import { GetPostJobDetailInput } from "../model/job.model";

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
            const data = await this.jobService.getAllJob(
                input
            );
            res.sendJson(data)
        } catch (error) {
            logger.error(`JobController.create: `, error);
            next(error);
        }
    };
    public createJobPost = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const input = req.body;
            const data = await this.jobService.createJob(
                input
            );
            res.sendJson(data)
        } catch (error) {
            logger.error(`JobController.create: `, error);
            next(error);
        }
    };
    public deleteJobPost = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const input = req.body as { companyId: string, jobId: string };

            const data = await this.jobService.deleteJobPost(
                input
            );
            res.sendJson(data)
        } catch (error) {
            logger.error(`JobController.create: `, error);
            next(error);
        }
    };

    public getPostJobDetail = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const input = req.query as GetPostJobDetailInput;
            const data = await this.jobService.getPostJobDetail(input);
            res.sendJson(data)
        } catch (error) {
            logger.error(`getPostJobDetail.create: `, error);
            next(error);
        }
    }

    public updateCompanyJob = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const input = req.body;
            const data = await this.jobService.updateCompanyJob(input);
            res.sendJson(data)
        } catch (error) {
            logger.error(`getPostJobDetail.create: `, error);
            next(error);
        }
    }
}