import elasticManage from "@/common/infrastructure/elasticsearch.adapter";
import { DatabaseAdapter } from "@/common/infrastructure/database.adapter";
import { ObjectId } from "mongodb";
import axios from "axios";

export interface ISearchService {
    getGlobalSearch(keyword: string, cookie: string, authorization: string): Promise<any>
}
export class SearchService implements ISearchService {
    private static client = elasticManage.getClient();
    public getGlobalSearch = async (keyword: string, cookie: string, authorization: string): Promise<any> => {
        console.log(keyword);
        if (!keyword || keyword.trim().length === 0) {
            return {
                posts: [],
                jobs: [],
                users: [],
                companies: [],
                totalResults: {
                    posts: 0,
                    jobs: 0,
                    users: 0,
                    companies: 0
                }
            };
        }

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
                        multi_match: {
                            query: keyword,
                            fields: ["title^2", "content"]
                        }
                    }
                },
                { index: "post" },
                {
                    from,
                    size: pageSize,
                    track_total_hits: true,
                    query: {
                        multi_match: {
                            query: keyword,
                            fields: ["content"]
                        }
                    }
                },
                { index: "user" },
                {
                    from,
                    size: pageSize,
                    track_total_hits: true,
                    query: {
                        multi_match: {
                            query: keyword,
                            fields: ["name"]
                        }
                    }
                },
                { index: "company" },
                {
                    from,
                    size: pageSize,
                    track_total_hits: true,
                    query: {
                        multi_match: {
                            query: keyword,
                            fields: ["name"]
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
        const [postResults, jobResults] = await Promise.all([
            postIds.length > 0
                ? DatabaseAdapter.getInstance().post.find({ _id: { $in: postIds } }).toArray()
                : Promise.resolve([]),
            jobIds.length > 0
                ? DatabaseAdapter.getInstance().job.find({ _id: { $in: jobIds } }).toArray()
                : Promise.resolve([])
        ]);

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
        const postMap = new Map(postResults.map(doc => [doc._id.toString(), doc]));
        const jobMap = new Map(jobResults.map(doc => [doc._id.toString(), doc]));
        const userMap = new Map(userResults.data.data.map((user: any) => [user.userId, user]));
        const companyMap = new Map(companyResults.data.data.map((company: any) => [company.companyId, company]));

        // Maintain search result order
        const orderedPosts = (searchMap.get("post") || [])
            .map(id => postMap.get(id))
            .filter(Boolean);

        const orderedJobs = (searchMap.get("job") || [])
            .map(id => jobMap.get(id))
            .filter(Boolean);

        const orderedUsers = (searchMap.get("user") || [])
            .map(id => userMap.get(id))
            .filter(Boolean);

        const orderedCompanies = (searchMap.get("company") || [])
            .map(id => companyMap.get(id))
            .filter(Boolean);

        // Return final results
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
        console.log("finalResults", finalResults);

        return finalResults
    }
}