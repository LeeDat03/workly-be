import '@/common/extensions/express.extension';
import { ExpressServer } from "@/api/server";
import { PORT } from "@/common/enviroment";
import logger from "@/common/logger";
import { DatabaseAdapter } from "@/common/infrastructure/database.adapter";
import { ContainerManager } from "./api/container";
import { initializeIndexModel } from './api/model/model';

export class Application {

    private static databaseInstance = DatabaseAdapter.getInstance();


    public static async createApplication(): Promise<ExpressServer> {
        await this.databaseInstance.connect();
        await ContainerManager.initializeAll();
        await initializeIndexModel();
        const expressServer = new ExpressServer();
        await expressServer.setup(Number(PORT));
        Application.handleExit(expressServer);

        return expressServer;
    }

    // private static handleExit(expressServer: ExpressServer, workerServer: WorkerServer, socketServer: SocketServer) {
    private static handleExit(expressServer: ExpressServer) {
        const shutdown = async (exitCode: number) => {
            logger.info('Starting graceful shutdown...');
            try {
                await expressServer.kill();
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

