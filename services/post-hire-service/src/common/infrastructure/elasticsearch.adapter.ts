import { Client, ClientOptions } from '@elastic/elasticsearch';

class ElasticsearchAdapter {
    private static instance: ElasticsearchAdapter;
    private static client: Client;

    private constructor(options: ClientOptions) {
        ElasticsearchAdapter.client = new Client(options);
    }

    public static connect(): ElasticsearchAdapter {
        if (!ElasticsearchAdapter.instance) {
            ElasticsearchAdapter.instance = new ElasticsearchAdapter({
                node: 'http://localhost:9200',
            });
        }
        return ElasticsearchAdapter.instance;
    }

    public getClient(): Client {
        return ElasticsearchAdapter.client;
    }

    public static async testConnection(): Promise<void> {
        try {
            const health = await this.client.cluster.health();
            console.log('Cluster health:', health);
        } catch (error) {
            console.error('Elasticsearch connection error:', error);
        }
    }
}

export default ElasticsearchAdapter;
