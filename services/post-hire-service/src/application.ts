import '@/common/extensions/express.extension';
import { ExpressServer } from "@/api/server";
import { PORT } from "@/common/enviroment";
import logger from "@/common/logger";
import { DatabaseAdapter } from "@/common/infrastructure/database.adapter";
import { ContainerManager } from "./api/container";
import { initializeIndexModel } from './api/model/model';
import { RedisAdapter } from '@/common/infrastructure/redis.adapter';
import { WorkerServer } from './worker/server';
import RabbitMQConnection from './common/infrastructure/mq.adapter';
import elasticManage from './common/infrastructure/elasticsearch.adapter';
import { registerAllQueue, setupAllConsumers } from './api/service/mq.service';

export class Application {

    private static databaseInstance = DatabaseAdapter.getInstance();


    public static async createApplication(): Promise<ExpressServer> {
        await this.databaseInstance.connect();
        await RedisAdapter.connect();
        await RabbitMQConnection.connect();
        await ContainerManager.initializeAll();
        elasticManage.testConnection();
        await registerAllQueue()
        await setupAllConsumers()
        await initializeIndexModel();
        const expressServer = new ExpressServer();
        await expressServer.setup(Number(PORT));
        const workerServer = new WorkerServer();
        await workerServer.setup();
        Application.handleExit(expressServer, workerServer);

        return expressServer;
    }

    private static handleExit(expressServer: ExpressServer, workerServer: WorkerServer) {
        const shutdown = async (exitCode: number) => {
            logger.info('Starting graceful shutdown...');
            try {
                await expressServer.kill();
                await workerServer.kill();

                logger.info('Shutdown complete, bye bye!');
                process.exit(exitCode);
            } catch (err) {
                logger.error('Error during shutdown', err);
                process.exit(1);
            }
        };

        process.on('uncaughtException', (err: unknown) => {
            logger.error('Uncaught exception', err);
            shutdown(1);
        });

        process.on('unhandledRejection', (reason: unknown | null | undefined) => {
            logger.error('Unhandled Rejection at promise', reason);
            shutdown(2);
        });

        process.on('SIGINT', () => {
            logger.info('Caught SIGINT, exiting!');
            shutdown(128 + 2);
        });

        process.on('SIGTERM', () => {
            logger.info('Caught SIGTERM, exiting');
            shutdown(128 + 2);
        });

        process.on('exit', () => {
            logger.info('Exiting process...');
        });
    }
}

