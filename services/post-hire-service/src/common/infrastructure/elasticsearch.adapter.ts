import { Client } from '@elastic/elasticsearch';

class ElasticsearchAdapter {
    private static client: Client;

    constructor() {
        if (!ElasticsearchAdapter.client) {
            ElasticsearchAdapter.client = new Client({
                node: "https://my-elasticsearch-project-a6caab.es.us-central1.gcp.elastic.cloud:443",
                auth: {
                    apiKey: "RE1xaTdwb0JVU0pBenBMcjhRMFQ6OGJGaTNUOTJhRGl5UElLUGREaUdidw==",
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
        }
    }

    public getClient(): Client {
        return ElasticsearchAdapter.client;
    }
    public async testConnection(): Promise<void> {
        try {
            const info = await ElasticsearchAdapter.client.info();
            console.log('Connected:', info);
        } catch (error) {
            console.error('Elasticsearch connection error:', error);
        }
    }
}

const elasticManage = new ElasticsearchAdapter();
export default elasticManage;
