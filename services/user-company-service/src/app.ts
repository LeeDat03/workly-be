import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import { config } from "./config";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares";
import logger from "./utils/logger";

class App {
	public app: Application;

	constructor() {
		this.app = express();
		this.initializeMiddlewares();
		this.initializeRoutes();
		this.initializeErrorHandling();
		logger.info("App initialized");
	}

	private initializeMiddlewares(): void {
		this.app.use(helmet());

		this.app.use(
			cors({
				origin: config.cors.origin,
				credentials: true,
			}),
		);

		this.app.use(compression());

		this.app.use(express.json());
		this.app.use(express.urlencoded({ extended: true }));

		if (config.env === "development") {
			this.app.use(morgan("dev"));
		} else {
			this.app.use(morgan("combined"));
		}
	}

	private initializeRoutes(): void {
		this.app.use(routes);

		this.app.get("/", (req, res) => {
			res.json({
				success: true,
				message: "User-Company Service API",
				version: "1.0.0",
			});
		});
	}

	private initializeErrorHandling(): void {
		this.app.use(notFoundHandler);
		this.app.use(errorHandler);
	}

	public getApp(): Application {
		return this.app;
	}
}

export default new App().getApp();
