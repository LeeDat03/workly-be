import { InsertOneResult } from "mongodb/mongodb";
import { JobSearch, PagingList } from "../model/common.model";
import { GetPostJobDetailInput, Job } from "../model/job.model";
import { IJobRepository } from "../repository/job.repository";
import { APIError } from "@/common/error/api.error";
import { ICandidateRepository } from "../repository/candidate.repository";
import { ErrorCode, StatusCode } from "@/common/errors";
import { Candidate } from "../model/candidate.model";

export interface IJobService {
    getAllJob(input: JobSearch): Promise<PagingList<Job>>
    createJob(input: any): Promise<InsertOneResult>
    deleteJobPost(input: any): Promise<Boolean>
    getPostJobDetail(input: GetPostJobDetailInput): Promise<Job>
    updateCompanyJob(input: any): Promise<Boolean>
    getPostJobByStatus(active: number, page: number, size: number, companyId: string): Promise<PagingList<Job>>
    applyJob(input: any): Promise<InsertOneResult>
    getCandidateByStatus(status: string, jobId: string, page: number, size: number): Promise<PagingList<Candidate>>
    feedbackCandidate(status: string, jobId: string, userId: string): Promise<Boolean>
}

export class JobService implements IJobService {
    private jobRepository: IJobRepository;
    private candidateRepository: ICandidateRepository;
    constructor(
        jobRepository: IJobRepository,
        candidateRepository: ICandidateRepository
    ) {
        this.jobRepository = jobRepository
        this.candidateRepository = candidateRepository
    }
    async feedbackCandidate(status: string, jobId: string, userId: string): Promise<Boolean> {
        const result = this.candidateRepository.feedbackCandidate(status, jobId, userId);
        if (!result) {
            throw new APIError({ message: "candidate not found" })
        }
        return result;
    }
    async applyJob(input: any): Promise<InsertOneResult> {

        const check = await this.candidateRepository.genCandidateByUserIdAndJobId(input.userId, input.jobId)
        if (!!check) {
            throw new APIError({ message: "You have already applied for this job", errorCode: ErrorCode.BAD_REQUEST, status: StatusCode.BAD_REQUEST })
        }
        const result = await this.candidateRepository.applyJob({ ...input, status: "PENDING" });
        return result
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
    async getPostJobByStatus(active: number, page: number, size: number, companyId: string): Promise<PagingList<Job>> {
        return await this.jobRepository.getPostJobByStatus(active, page, size, companyId)
    }
    async getCandidateByStatus(status: string, jobId: string, page: number, size: number): Promise<PagingList<Candidate>> {
        return await this.candidateRepository.getCandidateByStatus(status, jobId, page, size)
    }
}