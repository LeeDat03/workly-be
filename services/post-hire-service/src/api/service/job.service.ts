import { InsertOneResult } from "mongodb/mongodb";
import { JobSearch, PagingList } from "../model/common.model";
import { GetPostJobDetailInput, Job } from "../model/job.model";
import { IJobRepository } from "../repository/job.repository";
import { APIError } from "@/common/error/api.error";

export interface IJobService {
    getAllJob(input: JobSearch): Promise<PagingList<Job>>
    createJob(input: any): Promise<InsertOneResult>
    deleteJobPost(input: any): Promise<Boolean>
    getPostJobDetail(input: GetPostJobDetailInput): Promise<Job>
    updateCompanyJob(input: any): Promise<Boolean>
}

export class JobService implements IJobService {
    private jobRepository: IJobRepository;
    constructor(
        jobRepository: IJobRepository
    ) {
        this.jobRepository = jobRepository
    }
    async updateCompanyJob(input: any): Promise<Boolean> {
        const result = await this.jobRepository.updateJob(input)
        if (!result) {
            throw new APIError({ message: "updateJob.fail" })
        }
        return result
    }
    async createJob(input: any): Promise<InsertOneResult> {
        const result = await this.jobRepository.createJob(input);
        return result;
    }
    async getAllJob(input: JobSearch): Promise<PagingList<Job>> {
        const result = await this.jobRepository.getPagingJobsByCompanyId(input)
        return result;
    }
    async deleteJobPost(input: any): Promise<Boolean> {
        const result = await this.jobRepository.deleteJob(input);
        if (!result) {
            throw new APIError({ message: "deletePost.Fail" })
        }
        return result;
    }
    async getPostJobDetail(input: GetPostJobDetailInput): Promise<Job> {
        const result = await this.jobRepository.getPostJobDetail(input)
        if (!result) {
            throw new APIError({ message: "jobPost.notfound" })
        }
        return result;
    }
}