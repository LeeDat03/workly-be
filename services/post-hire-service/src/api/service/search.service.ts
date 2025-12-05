import elasticManage from "@/common/infrastructure/elasticsearch.adapter";

export interface ISearchService {
    getGlobalSearch(keyword: string): Promise<any>
}
export class SearchService implements ISearchService {
    private static client = elasticManage.getClient();
    public getGlobalSearch = async (keyword: string): Promise<any> => {
        console.log(keyword);

        const pageSize = 5;
        const from = 0;

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
                    },
                    sort: [
                        { endDate: { order: "desc" } }
                    ]
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
                }
            ]
        }) as any;

        console.log("response", response.responses[0].hits, response.responses[1].hits);
    };
}