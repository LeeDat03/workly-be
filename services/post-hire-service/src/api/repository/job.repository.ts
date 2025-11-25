import { DatabaseAdapter } from "@/common/infrastructure/database.adapter";
import { JobSearch, PagingList } from "../model/common.model";
import { Job } from "../model/job.model";


export interface IJobRepository {
    getPagingJobsByCompanyId(input: JobSearch): Promise<PagingList<Job>>
}

export class JobRepository implements IJobRepository {

    private jobCollection: DatabaseAdapter;
    constructor(
        jobCollection: DatabaseAdapter
    ) {
        this.jobCollection = jobCollection
    }
    async getPagingJobsByCompanyId(input: JobSearch): Promise<PagingList<Job>> {
        console.log(input);

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