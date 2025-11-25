import { JobSearch, PagingList } from "../model/common.model";
import { Job } from "../model/job.model";
import { IJobRepository } from "../repository/job.repository";

export interface IJobService {
    getAllJob(input: JobSearch): Promise<PagingList<Job>>
}

export class JobService implements IJobService {
    private jobRepository: IJobRepository;
    constructor(
        jobRepository: IJobRepository
    ) {
        this.jobRepository = jobRepository
    }
    async getAllJob(input: JobSearch): Promise<PagingList<Job>> {
        const result = await this.jobRepository.getPagingJobsByCompanyId(input)
        return result;
    }
}