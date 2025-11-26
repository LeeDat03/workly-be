import { DatabaseAdapter } from "@/common/infrastructure/database.adapter";
import { JobSearch, PagingList } from "../model/common.model";
import { GetPostJobDetailInput, Job } from "../model/job.model";
import { DeleteResult, InsertOneResult, ObjectId } from "mongodb";
import { TimeHelper } from "@/util/time.util";


export interface IJobRepository {
    createJob(input: any): Promise<InsertOneResult>
    getPagingJobsByCompanyId(input: JobSearch): Promise<PagingList<Job>>
    deleteJob(input: any): Promise<Boolean>
    getPostJobDetail(input: GetPostJobDetailInput): Promise<Job | null>
    updateJob(input: any): Promise<Boolean>
}

export class JobRepository implements IJobRepository {

    private jobCollection: DatabaseAdapter;
    constructor(
        jobCollection: DatabaseAdapter
    ) {
        this.jobCollection = jobCollection
    }
    async updateJob(input: any): Promise<boolean> {
        const { jobId, companyId, ...rest } = input;

        const updateFields: any = {};

        for (const [key, value] of Object.entries(rest)) {
            if (value !== undefined && value !== null) {
                updateFields[key] = value;
            }
        }

        if (Object.keys(updateFields).length === 0) {
            return false;
        }

        const result = await this.jobCollection.job.updateOne(
            { _id: new ObjectId(jobId as string), companyId: companyId },
            { $set: updateFields }
        );

        return result.modifiedCount > 0;
    }
    async deleteJob(input: any): Promise<Boolean> {
        console.log(input);

        const result = await this.jobCollection.job.deleteOne({ companyId: input.companyId, _id: new ObjectId(input.jobId as string) })
        return result.deletedCount > 0;
    }
    async createJob(input: any): Promise<InsertOneResult> {
        const result = await this.jobCollection.job.insertOne({ ...input, createdAt: TimeHelper.now().format('YYYY-MM-DD HH:mm:ss') });
        return result;
    }

    async getPostJobDetail(input: GetPostJobDetailInput): Promise<Job | null> {
        return await this.jobCollection.job.findOne<Job>({ companyId: input.companyId, _id: new ObjectId(input.jobId) })
    }

    async getPagingJobsByCompanyId(input: JobSearch): Promise<PagingList<Job>> {
        // 1. Parse pagination params
        const page = input.page || 1;
        const size = input.size || 10;
        const skip = (page - 1) * size;

        // 2. Build filter object
        const filter: any = {};

        // Search theo title hoặc location
        if (input.search && input.searchType) {
            if (input.searchType === 'title') {
                filter.title = { $regex: input.search, $options: 'i' };
            } else if (input.searchType === 'location') {
                filter.location = { $regex: input.search, $options: 'i' };
            }
        }

        // Filter theo skills (case insensitive - lowercase)
        if (input.skills) {
            const skillsArray = input.skills.split(',')
                .filter(s => s.trim())
                .map(s => s.trim().toLowerCase());
            if (skillsArray.length > 0) {
                filter.skills = { $in: skillsArray };
            }
        }

        // Filter theo industries
        if (input.industries) {
            const industriesArray = input.industries.split(',')
                .filter(i => i.trim())
                .map(i => i.trim().toLowerCase());
            if (industriesArray.length > 0) {
                filter.industry = { $in: industriesArray };
            }
        }

        // Filter theo jobTypes
        if (input.jobType) {
            const jobTypesArray = input.jobType.split(',')
                .filter(t => t.trim())
                .map(t => t.trim().toLowerCase());
            if (jobTypesArray.length > 0) {
                filter.jobType = { $in: jobTypesArray };
            }
        }

        // Filter theo date range
        if (input.startAt || input.endAt) {
            filter.createdAt = {};
            if (input.startAt) {
                const startDate = new Date(input.startAt);
                filter.createdAt.$gte = startDate;
            }
            if (input.endAt) {
                const endDate = new Date(input.endAt);
                filter.createdAt.$lte = endDate;
            }
        }

        // 3. Execute query với pagination
        const [data, total] = await Promise.all([
            this.jobCollection.job.find<Job>(filter, {
                skip,
                limit: size,
                sort: { createdAt: -1 }
            }).toArray(),
            this.jobCollection.job.countDocuments(filter)
        ]);

        return {
            data,
            pagination: {
                page,
                size,
                total,
                totalPages: Math.ceil(total / size),
            },
        };
    }
}