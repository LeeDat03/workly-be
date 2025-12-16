import { Client } from '@elastic/elasticsearch';
import { ELASTICSEARCH_CLOUD_ID, ELASTICSEARCH_USERNAME, ELASTICSEARCH_PASSWORD, NODE_ENV, ELASTICSEARCH_URL } from '../enviroment';

class ElasticsearchAdapter {
    private static client: Client;

    constructor() {
        if (!ElasticsearchAdapter.client) {
            // if(NODE_ENV === "DEV") {
                ElasticsearchAdapter.client = new Client({
                    cloud: {
                        id: ELASTICSEARCH_CLOUD_ID
                    },
                    auth: {
                        username: ELASTICSEARCH_USERNAME,
                        password: ELASTICSEARCH_PASSWORD
                    }
                });
            // }else{
            //     console.log("Elatic prod")
            //     ElasticsearchAdapter.client = new Client({
            //         node: ELASTICSEARCH_URL
            //     });
            // }
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
