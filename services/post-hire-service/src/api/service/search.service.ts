import elasticManage from "@/common/infrastructure/elasticsearch.adapter";
import { DatabaseAdapter } from "@/common/infrastructure/database.adapter";
import { ObjectId } from "mongodb";
import axios from "axios";
import { ICommentRepository } from "../repository/comment.repository";
import { ILikeRepository } from "../repository/like.repository";
import { mapToPostResponse } from "../model/post.model";
import { USER_SERVICE_URL } from "@/common/enviroment";
import { IPostRepository } from "../repository/post.repository";
import { ICandidateRepository } from "../repository/candidate.repository";

export interface ISearchService {
    getUserSearch(keyword: string, page: number, size: number, cookie: string, authorization: string): Promise<any>
    getGlobalSearch(keyword: string, cookie: string, authorization: string, userId: string | undefined,
    ): Promise<any>
    getPostSearch(keyword: string, page: number, size: number): Promise<any>
    getJobSearch(
        userId: string | undefined,
        keyword: string,
        skills: string[],
        level: string,
        startDate: string,
        endDate: string,
        page: number,
        size: number
    ): Promise<any>
    getCompanySearch(keyword: string, page: number, size: number, cookie: string, authorization: string): Promise<any>
}
export class SearchService implements ISearchService {

    private commentRepository: ICommentRepository;
    private likeRepository: ILikeRepository;
    private postRepository: IPostRepository
    private candidateRepository: ICandidateRepository;

    constructor(commentRepository: ICommentRepository, likeRepository: ILikeRepository, postRepository: IPostRepository, candidateRepository: ICandidateRepository,
    ) {
        this.commentRepository = commentRepository;
        this.likeRepository = likeRepository;
        this.postRepository = postRepository;
        this.candidateRepository = candidateRepository;

    }
    async getPostSearch(keyword: string, page: number, size: number): Promise<any> {
        const data = await this.postRepository.getPagingPostSearch(keyword, page, size);
        const postIds = data.data.map((post) => post._id.toString());
        const commentCounts = await this.commentRepository.countCommentsByPostIds(postIds);
        const likePosts = await this.likeRepository.getAllLikeByListPost(postIds)
        const mappedData = data.data.map((item) => {
            const postResponse = mapToPostResponse(item);
            return {
                ...postResponse,
                totalComments: commentCounts[item._id.toString()] || 0,
                totalLikes: likePosts[item._id.toString()] || [],
            };
        });

        const authorIds = mappedData.map((post) => {
            return {
                id: post.author_id,
                type: post.author_type,
            };
        });

        const authorData = await axios
            .post(`${USER_SERVICE_URL}/internals/get-batch-ids`, {
                ids: authorIds,
            })
            .then((res) => res.data.data);

        const authorMap = new Map(
            authorData.map((item: any) => [item.id, item.data])
        );

        const postsWithAuthor = mappedData.map((post) => ({
            ...post,
            author: authorMap.get(post.author_id) || null,
        }));
        return {
            data: postsWithAuthor,
            pagination: data.pagination,
        };
    }

    public getUserSearch = async (keyword: string, page: number, size: number, cookie: string, authorization: string) => {
        const apiBaseUrl = process.env.USER_SERVICE_URL || 'http://localhost:8003';
        const from = (page - 1) * size;
        const query = {
            index: "user",
            from,
            size,
            query: {
                bool: {
                    must: keyword
                        ? [
                            {
                                wildcard: {
                                    name: {
                                        value: `*${keyword.toLowerCase()}*`,
                                    },
                                },
                            }
                        ]
                        : [
                            { match_all: {} }
                        ],
                },
            },
        };
        const result = await SearchService.client.search(query);

        const total = (typeof result.hits.total === 'object'
            ? result.hits.total.value
            : 0);

        const userIds = result.hits.hits.map((hit: any) => hit._id);

        const userPromise = userIds.length > 0
            ? await axios.post(
                `${apiBaseUrl}/api/v1/internals/users/get-batch`,
                { userIds: userIds },
                {
                    headers: {
                        Cookie: cookie,
                        Authorization: authorization,
                    },
                    withCredentials: true,
                }
            ).catch(error => {
                console.error('Error fetching companies:', error.message);
                return [];
            }).then((data: any) => data.data.data)
            : [];
        const userMap = new Map(userPromise.map((user: any) => [user.userId, user]));
        const orderedUsers = userIds
            .map(id => userMap.get(id))
            .filter(Boolean);
        const finalResults = {
            users: orderedUsers,
            pagination: {
                page,
                size,
                total,
                totalPages: Math.ceil(total / size),
            },
        };
        return finalResults
    }

    async getCompanySearch(keyword: string, page: number, size: number, cookie: string, authorization: string): Promise<any> {
        const apiBaseUrl = process.env.USER_SERVICE_URL || 'http://localhost:8003';
        const from = (page - 1) * size;
        const query = {
            index: "company",
            from,
            size,
            query: {
                bool: {
                    must: keyword
                        ? [
                            {
                                wildcard: {
                                    name: {
                                        value: `*${keyword.toLowerCase()}*`,
                                    },
                                },
                            }
                        ]
                        : [
                            { match_all: {} }
                        ],
                },
            },
        };
        const result = await SearchService.client.search(query);

        const total = (typeof result.hits.total === 'object'
            ? result.hits.total.value
            : 0);

        const companyIds = result.hits.hits.map((hit: any) => hit._id);
        console.log("companyIds", companyIds);

        const companyPromise = companyIds.length > 0
            ? await axios.post(
                `${apiBaseUrl}/api/v1/internals/companies/get-batch`,
                { companyIds: companyIds },
                {
                    headers: {
                        Cookie: cookie,
                        Authorization: authorization,
                    },
                    withCredentials: true,
                }
            ).catch(error => {
                console.error('Error fetching companies:', error.message);
                return [];
            }).then((data: any) => data.data.data)
            : [];
        const companyMap = new Map(companyPromise.map((company: any) => [company.companyId, company]));
        const orderedCompanies = companyIds
            .map(id => companyMap.get(id))
            .filter(Boolean);
        const finalResults = {
            companies: orderedCompanies,
            pagination: {
                page,
                size,
                total,
                totalPages: Math.ceil(total / size),
            },
        };
        return finalResults
    }

    private static client = elasticManage.getClient();
    public getGlobalSearch = async (keyword: string, cookie: string, authorization: string, userId: string | undefined): Promise<any> => {
        const pageSize = 5;
        const from = 0;

        // Elasticsearch multi-search
        const response = await SearchService.client.msearch({
            body: [
                { index: "job" },
                {
                    from,
                    size: pageSize,
                    track_total_hits: true,
                    query: {
                        bool: {
                            should: [
                                { wildcard: { title: `*${keyword}*` } },
                                { wildcard: { content: `*${keyword}*` } }
                            ]
                        }
                    }
                },
                { index: "post" },
                {
                    from,
                    size: pageSize,
                    track_total_hits: true,
                    query: {
                        bool: {
                            should: [
                                { wildcard: { content: `*${keyword}*` } }
                            ]
                        }
                    }
                },
                { index: "user" },
                {
                    from,
                    size: pageSize,
                    track_total_hits: true,
                    query: {
                        bool: {
                            should: [
                                { wildcard: { name: `*${keyword}*` } }
                            ]
                        }
                    }
                },
                { index: "company" },
                {
                    from,
                    size: pageSize,
                    track_total_hits: true,
                    query: {
                        bool: {
                            should: [
                                { wildcard: { name: `*${keyword}*` } }
                            ]
                        }
                    }
                }
            ]
        }) as any;

        // Map results correctly with proper index names
        const searchMap = new Map<string, string[]>();
        const totalMap = new Map<string, number>();
        const indexNames = ["job", "post", "user", "company"];

        response.responses.forEach((item: any, index: number) => {
            if (Array.isArray(item.hits?.hits)) {
                const ids = item.hits.hits.map((hit: any) => hit._id);
                searchMap.set(indexNames[index], ids);

                const total = typeof item.hits.total === 'object'
                    ? item.hits.total.value
                    : item.hits.total;
                totalMap.set(indexNames[index], total || 0);
            }


        });


        // Get IDs for each entity type
        const postIds = (searchMap.get("post") || []).map((id: string) => new ObjectId(id));
        const jobIds = (searchMap.get("job") || []).map((id: string) => new ObjectId(id));
        const userPayload = searchMap.get("user") || [];
        const companyPayload = searchMap.get("company") || [];

        // Fetch data from databases
        const [postResults, jobResults, commentCounts, likePosts] = await Promise.all([
            postIds.length > 0
                ? DatabaseAdapter.getInstance().post.find({ _id: { $in: postIds } }).toArray()
                : Promise.resolve([]),
            jobIds.length > 0
                ? DatabaseAdapter.getInstance().job.find({ _id: { $in: jobIds } }).toArray()
                : Promise.resolve([]),
            postIds.length > 0
                ? this.commentRepository.countCommentsByPostIds(postIds.map(p => p.toString()))
                : Promise.resolve({} as Record<string, number>),
            postIds.length > 0
                ? this.likeRepository.getAllLikeByListPost(postIds.map(p => p.toString()))
                : Promise.resolve({} as Record<string, any[]>)
        ]);

        const mappedPostResults = postResults.map((item) => {
            const postResponse = mapToPostResponse(item);
            return {
                ...postResponse,
                totalComments: commentCounts[item._id.toString()] || 0,
                totalLikes: likePosts[item._id.toString()] || [],
            };
        });
        const authorIds = mappedPostResults.map((post) => {
            return {
                id: post.author_id,
                type: post.author_type,
            };
        });

        const authorData = postResults.length > 0 ? await axios
            .post(`${USER_SERVICE_URL}/internals/get-batch-ids`, {
                ids: authorIds,
            })
            .then((res) => res.data.data) : [];

        const authorMap = new Map(
            authorData.map((item: any) => [item.id, item.data])
        );

        const postsWithAuthor = mappedPostResults.map((post) => ({
            ...post,
            author: authorMap.get(post.author_id) || null,
        }));

        //JOB
        const companyIds = jobResults.map((job) => {
            return {
                id: job.companyId,
                type: "COMPANY",
            };
        });

        const companyData = jobResults.length > 0 ? await axios
            .post(`${USER_SERVICE_URL}/internals/get-batch-ids`, {
                ids: companyIds,
            })
            .then((res) => res.data.data) : [];

        const companiesMap = new Map(
            companyData.map((item: any) => [item.id, item.data])
        );
        console.log(companiesMap);

        const jobsWithAuthor = jobResults.map((job) => ({
            ...job,
            company: companiesMap.get(job.companyId) || null,
        }));

        // Fetch user and company data from external API
        const apiBaseUrl = process.env.USER_SERVICE_URL || 'http://localhost:8003';
        console.log(userPayload, companyPayload);

        const userPromise = userPayload.length > 0
            ? axios.post(
                `${apiBaseUrl}/api/v1/internals/users/get-batch`,
                { userIds: userPayload },
                {
                    headers: {
                        Cookie: cookie,
                        Authorization: authorization,
                    },
                    withCredentials: true,
                }
            ).catch(error => {
                console.error('Error fetching users:', error.message);
                return { data: { data: [] } };
            })
            : Promise.resolve({ data: { data: [] } });

        const companyPromise = companyPayload.length > 0
            ? axios.post(
                `${apiBaseUrl}/api/v1/internals/companies/get-batch`,
                { companyIds: companyPayload },
                {
                    headers: {
                        Cookie: cookie,
                        Authorization: authorization,
                    },
                    withCredentials: true,
                }
            ).catch(error => {
                console.error('Error fetching companies:', error.message);
                return { data: { data: [] } };
            })
            : Promise.resolve({ data: { data: [] } });

        const [userResults, companyResults] = await Promise.all([
            userPromise,
            companyPromise
        ]);
        // Create maps for quick lookup
        const postMap = new Map(postsWithAuthor.map(doc => [doc._id.toString(), doc]));
        const jobMap = new Map(jobsWithAuthor.map(doc => [doc._id.toString(), doc]));
        const userMap = new Map(userResults.data.data.map((user: any) => [user.userId, user]));
        const companyMap = new Map(companyResults.data.data.map((company: any) => [company.companyId, company]));

        const orderedPosts = (searchMap.get("post") || [])
            .map(id => postMap.get(id))
            .filter(Boolean);

        let orderedJobs = (searchMap.get("job") || [])
            .map(id => jobMap.get(id))
            .filter(Boolean);

        const orderedUsers = (searchMap.get("user") || [])
            .map(id => userMap.get(id))
            .filter(Boolean);

        const orderedCompanies = (searchMap.get("company") || [])
            .map(id => companyMap.get(id))
            .filter(Boolean);
        if (userId) {
            const jobIds = orderedJobs.map((job: any) => job._id.toString())
            const candidateData = await this.candidateRepository.checkCandidateByUserIdAndJobIds(userId, jobIds)

            orderedJobs = orderedJobs.map((job: any) => ({
                ...job,
                isApplied: candidateData.some(candidate => candidate.jobId === job._id.toString())
            }))
        } else {
            orderedJobs = orderedJobs.map((job: any) => ({
                ...job,
                isApplied: false
            }))
        }
        const finalResults = {
            posts: orderedPosts,
            jobs: orderedJobs,
            users: orderedUsers,
            companies: orderedCompanies,
            totalResults: {
                posts: totalMap.get("post") || 0,
                jobs: totalMap.get("job") || 0,
                users: totalMap.get("user") || 0,
                companies: totalMap.get("company") || 0
            }
        };
        return finalResults
    }
    public getJobSearch = async (
        userId: string | undefined,
        keyword: string,
        skills: string[],
        level: string,
        startDate: string,
        endDate: string,
        page: number,
        size: number
    ): Promise<any> => {
        console.log("check", keyword, skills, level, startDate, endDate, page, size);

        const must: any[] = [];
        const filter: any[] = [];

        // Keyword search using wildcard
        if (keyword) {
            const lower = keyword.toLowerCase();

            must.push({
                bool: {
                    should: [
                        {
                            wildcard: {
                                "title": `*${lower}*`
                            }
                        },
                        {
                            wildcard: {
                                "content": `*${lower}*`
                            }
                        }
                    ],
                    minimum_should_match: 1
                }
            });
        }

        if (skills && skills.length > 0) {
            filter.push({
                terms: {
                    "skills.keyword": skills
                }
            });
        }

        if (level) {
            filter.push({
                term: {
                    level: level
                }
            });
        }

        if (startDate || endDate) {
            filter.push({
                range: {
                    endDate: {
                        gte: startDate || undefined,
                        lte: endDate || undefined
                    }
                }
            });
        }

        const queryBody = {
            from: (page - 1) * size,
            size: size,
            query: {
                bool: {
                    must,
                    filter
                }
            }
        };

        const item = await SearchService.client.search({
            index: "job",
            body: queryBody
        } as any);

        const total = (typeof item.hits.total === 'object'
            ? item.hits.total.value
            : 0);
        const jobIds = item.hits.hits.map((hit: any) => hit._id);
        const jobResults = jobIds.length > 0
            ? await DatabaseAdapter.getInstance().job.find({ _id: { $in: jobIds.map(jobId => new ObjectId(jobId as string)) } }).toArray()
            : []


        const companyIds = jobResults.map((job) => {
            return {
                id: job.companyId,
                type: "COMPANY",
            };
        });
        const companyData = jobResults.length > 0 ? await axios
            .post(`${USER_SERVICE_URL}/internals/get-batch-ids`, {
                ids: companyIds,
            })
            .then((res) => res.data.data) : [];
        const companiesMap = new Map(
            companyData.map((item: any) => [item.id, item.data])
        );

        const jobsWithAuthor = jobResults.map((job) => ({
            ...job,
            company: companiesMap.get(job.companyId) || null,
        }));
        const jobMap = new Map(jobsWithAuthor.map(doc => [doc._id.toString(), doc]));

        let orderedJobs = jobIds
            .map(id => jobMap.get(id))
            .filter(Boolean);
        if (userId) {
            const jobIds = orderedJobs.map((job: any) => job._id.toString())
            const candidateData = await this.candidateRepository.checkCandidateByUserIdAndJobIds(userId, jobIds)

            orderedJobs = orderedJobs.map((job: any) => ({
                ...job,
                isApplied: candidateData.some(candidate => candidate.jobId === job._id.toString())
            }))
        } else {
            orderedJobs = orderedJobs.map((job: any) => ({
                ...job,
                isApplied: false
            }))
        }
        const finalResults = {
            jobs: orderedJobs,
            pagination: {
                page,
                size,
                total,
                totalPages: Math.ceil(total / size),
            },
        };
        return finalResults
    }

}