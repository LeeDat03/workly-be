import { Client } from '@elastic/elasticsearch';

class ElasticsearchAdapter {
    private static client: Client;

    constructor() {
        if (!ElasticsearchAdapter.client) {
            ElasticsearchAdapter.client = new Client({
                node: 'http://localhost:9200',
            });
        }
    }

    public getClient(): Client {
        return ElasticsearchAdapter.client;
    }

    public async testConnection(): Promise<void> {
        try {
            const health = await ElasticsearchAdapter.client.cluster.health();
            console.log('Cluster health:', health);
        } catch (error) {
            console.error('Elasticsearch connection error:', error);
        }
    }
}

const elasticManage = new ElasticsearchAdapter();
export default elasticManage;
