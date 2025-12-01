import { DatabaseAdapter } from "@/common/infrastructure/database.adapter";
import { InsertOneResult, UpdateResult } from "mongodb";
import { Candidate } from "../model/candidate.model";
import { PagingList } from "../model/common.model";



export interface ICandidateRepository {
    applyJob(input: any): Promise<InsertOneResult>
    genCandidateByUserIdAndJobId(userId: number, jobId: number): Promise<Candidate | null>
    getCandidateByStatus(
        status: string,
        jobId: string,
        page: number,
        size: number
    ): Promise<PagingList<Candidate>>
    feedbackCandidate(
        status: string,
        jobId: string,
        userId: string
    ): Promise<Boolean>
}

export class candidateRepository implements ICandidateRepository {
    private candidateCollection: DatabaseAdapter;
    constructor(
        candidateCollection: DatabaseAdapter,
    ) {
        this.candidateCollection = candidateCollection
    }
    genCandidateByUserIdAndJobId = async (userId: number, jobId: number): Promise<Candidate | null> => {
        return await this.candidateCollection.candidate.findOne<Candidate>({
            userId: userId,
            jobId: jobId
        });
    }
    applyJob = async (input: any): Promise<InsertOneResult> => {
        if (!input?.userId || !input?.jobId) {
            throw new Error("userId and jobId are required");
        }
        return await this.candidateCollection.candidate.insertOne({
            ...input,
            createdAt: new Date()
        });
    }

    getCandidateByStatus = async (
        status: string,
        jobId: string,
        page: number = 1,
        size: number = 10
    ): Promise<PagingList<Candidate>> => {
        const skip = (page - 1) * size;

        const matchCondition: any = { jobId: jobId };

        if (status) {
            matchCondition.status = status;
        }

        const dataPipeline: any[] = [
            { $match: matchCondition },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: Number(size) }
        ];

        const countPipeline: any[] = [
            { $match: matchCondition },
            { $count: "total" }
        ];

        const [data, countResult] = await Promise.all([
            this.candidateCollection.candidate.aggregate<Candidate>(dataPipeline).toArray(),
            this.candidateCollection.candidate.aggregate(countPipeline).toArray()
        ]);

        const total = countResult[0]?.total || 0;

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

    feedbackCandidate = async (
        status: string,
        jobId: string,
        userId: string
    ): Promise<Boolean> => {

        const result = await this.candidateCollection.candidate.updateOne(
            {
                jobId: jobId,
                userId: userId
            },
            {
                $set: {
                    status: status,
                    updatedAt: new Date()
                }
            }
        );
        if (result.matchedCount === 0 || result.modifiedCount === 0) {
            return false;
        }
        return true;
    };
}