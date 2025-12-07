import { Client } from '@elastic/elasticsearch';

class ElasticsearchAdapter {
    private static client: Client;

    constructor() {
        if (!ElasticsearchAdapter.client) {
            ElasticsearchAdapter.client = new Client({
                cloud: {
                    id: "test:dXMtY2VudHJhbDEuZ2NwLmNsb3VkLmVzLmlvOjQ0MyRlNWZhNDU4YTg4ZWE0OGMyOGI5MzkzMjc1ZmU0YWUzNiRmMGUyOTc0ZGI3MzA0ZWFlOWVmNjU0NWViOGEzYWNlOA=="
                },
                auth: {
                    username: "elastic",
                    password: "TPGg7pCfcAsu1zaC2FCdml7v"
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
