import { NextFunction, Request, Response } from "express";
import logger from "@/common/logger";
import { IJobService } from "../service/job.service";
import { JobSearch } from "../model/common.model";
import { GetPostJobDetailInput } from "../model/job.model";
import { sendJobToUCQueue } from "../service/mq.service";
import { APIError } from "@/common/error/api.error";
import axios from "axios";
import { Company } from "../model/post.model";

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
            const userId = (req as any).user?.userId;
            const data = await this.jobService.getAllJob(
                userId,
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
            if (data.acknowledged && data.insertedId) {
                sendJobToUCQueue({
                    jobId: data.insertedId.toString(),
                    companyId: input.companyId,
                    skills: input.skills,
                    action: "created",
                    endDate: input.endDate,
                })
            }
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
            sendJobToUCQueue({
                jobId: input.jobId,
                companyId: input.companyId,
                action: "deleted",
            })
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
            sendJobToUCQueue({
                jobId: input.jobId,
                companyId: input.companyId,
                skills: input.skills,
                action: "updated",
                endDate: input.endDate,
            })
        } catch (error) {
            logger.error(`getPostJobDetail.create: `, error);
            next(error);
        }
    }
    public getPostJobByStatus = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { active, page, size, companyId } = req.query
            const data = await this.jobService.getPostJobByStatus(Number(active), Number(page), Number(size), companyId as string)
            res.sendJson(data)
        } catch (error) {
            logger.error(`getPostJobDetail.create: `, error);
            next(error);
        }
    }
    public applyJob = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const input = req.body
            const { userId, email, name } = req.user as any
            const data = await this.jobService.applyJob({ ...input, userId, email, name });
            res.sendJson(data)
        } catch (error) {
            logger.error(`applyJob.create: `, error);
            next(error);
        }
    }
    public getCandidateByStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { status, jobId, page, size } = req.query as any
            const data = await this.jobService.getCandidateByStatus(status, jobId, page, size)
            res.sendJson(data)
        } catch (error) {
            logger.error(`applyJob.create: `, error);
            next(error);
        }
    }
    public feedbackCandidate = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { status, jobId, userId } = req.body as any
            const data = await this.jobService.feedbackCandidate(status, jobId, userId)
            res.sendJson(data)
        } catch (error) {
            logger.error(`applyJob.create: `, error);
            next(error);
        }
    }
    public getAppliedJobs = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const apiBaseUrl = process.env.USER_SERVICE_URL || 'http://localhost:8003';
            const userId = req.user?.userId
            if (userId === undefined) {
                throw new APIError({ message: "login is required" })
            }
            const data = await this.jobService.getAppliedJobs(userId);

            const companyIds = data
                .map((item) => {
                    console.log(item);
                    return item.jobInfo.companyId
                })

            const companyPromise = companyIds.length > 0
                ? await axios.post(
                    `${apiBaseUrl}/api/v1/internals/companies/get-batch`,
                    { companyIds: companyIds },
                    {
                        headers: {
                            Cookie: req.headers.cookie,
                            Authorization: req.headers.authorization,
                        },
                        withCredentials: true,
                    }
                ).catch(error => {
                    console.error('Error fetching companies:', error.message);
                    return [];
                }).then((data: any) => data.data.data)
                : [];
            const companyMap = new Map(companyPromise.map((company: any) => [company.companyId, company]));



            const dataAfterMapping = data.map((item) => ({
                ...item,
                jobInfo: item.jobInfo
                    ? {
                        companyInfo: companyMap.get(item.jobInfo.companyId) ?? null, ...item.jobInfo,
                    }
                    : null,
            }));
            res.sendJson(dataAfterMapping)
        } catch (error) {
            logger.error(`getAppliedJobs.get: `, error);
            next(error);
        }
    }
}