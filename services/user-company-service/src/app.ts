import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { config } from "./config";
import routes from "./routes";
import logger from "./utils/logger";
import { globalErrorHandler } from "./middlewares/errorHandler";
import {
	registerAllQueues,
	startConsumingQueues,
} from "./infrastructure/queue/setup";

class App {
	public app: Application;

	constructor() {
		this.app = express();
		this.initializeMiddlewares();
		this.initializeRoutes();
		this.initializeErrorHandling();
		this.initializeQueues();
		logger.info("App initialized");
	}

	private async initializeQueues(): Promise<void> {
		try {
			await registerAllQueues();
			await startConsumingQueues();
		} catch (error) {
			logger.error("❌ Failed to initialize RabbitMQ queues:", error);
			// Don't throw - let the app start even if MQ fails
		}
	}

	private initializeMiddlewares(): void {
		this.app.use(helmet());
		this.app.use(
			cors({
				origin: config.cors.origin,
				credentials: true,
				methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
				allowedHeaders: "Content-Type, Authorization",
			}),
		);
		this.app.use(compression());
		this.app.use(express.json());
		this.app.use(express.urlencoded({ extended: true }));
		this.app.use(cookieParser());

		if (config.env === "development") {
			this.app.use(morgan("dev"));
		} else {
			this.app.use(morgan("combined"));
		}
	}

	private initializeRoutes(): void {
		this.app.use("/api/v1/", routes);

		this.app.get("/", (req, res) => {
			res.json({
				success: true,
				message: "User-Company Service API is healthy",
				version: "1.0.0",
			});
		});
	}

	private initializeErrorHandling(): void {
		this.app.use(globalErrorHandler);
	}

	public getApp(): Application {
		return this.app;
	}
}

export default new App().getApp();
