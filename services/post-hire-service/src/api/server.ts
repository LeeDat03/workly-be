import express, { Express } from "express";
import bodyParser from "body-parser";
import { Server } from "http";
import cors from "cors";
import helmet from "helmet";
import { RateLimiterMiddleware } from "@/api/middlewares/ratelimit.middleware";
import { NODE_ENV } from "@/common/enviroment";
import logger from "@/common/logger";
import { createPostRoutes } from "./routes/post.routes";
import { ResponseMiddleware } from "./middlewares/response.middleware";
import { PublicPath } from "@/config/app.constant";
import cookieParser from "cookie-parser";
import { createJobRoutes } from "./routes/job.routes";
import { createFeedRoutes } from "./routes/feed.routes";
import { createSearchRoutes } from "./routes/search.route";
import { createBookmarkRoutes } from "./routes/bookmark.routes";

export class ExpressServer {
	private server?: Express;
	private httpServer?: Server;

	public async setup(port: number): Promise<Express> {
		const server = express();
		this.setupStandardMiddlewares(server);
		this.setupSecurityMiddlewares(server);
		this.configureRoutes(server);
		this.setupErrorHandlers(server);
		this.httpServer = this.listen(server, port);
		this.server = server;
		return this.server;
	}

	public listen(server: Express, port: number): Server {
		logger.info(`Starting gateway on port ${port} (${NODE_ENV})`);
		return server.listen(port);
	}

	public async kill(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this.httpServer) {
				this.httpServer.close((err) => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			} else {
				resolve();
			}
		});
	}

	private setupSecurityMiddlewares(server: Express) {
		server.use(helmet({ frameguard: false }));
		server.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
		server.use(
			helmet.contentSecurityPolicy({
				directives: {
					defaultSrc: ["'self'"],
					styleSrc: ["'unsafe-inline'"],
					scriptSrc: ["'unsafe-inline'", "'self'"],
					frameAncestors: ["*"],
				},
			})
		);

		const allowedOrigins = [
			"http://localhost:3000",
			"http://localhost:3001",
			"http://localhost:8000",
		];

		server.use(
			cors({
				origin: (origin, callback) => {
					if (!origin || allowedOrigins.includes(origin)) {
						callback(null, true);
					} else {
						callback(new Error("Not allowed by CORS"));
					}
				},
				credentials: true,
			})
		);
		server.set("trust proxy", true);
		server.use(RateLimiterMiddleware.createGlobalLimiter());
	}

	private setupStandardMiddlewares(server: Express) {
		server.use(cookieParser());

		server.use(
			bodyParser.json({
				verify: (req: any, res, buf) => {
					req.rawBody = buf;
				},
			})
		);
		server.use(bodyParser.urlencoded({ extended: true }));
	}
	private configureRoutes(server: Express) {
		server.use(PublicPath.PUBLIC_FILES, express.static("uploads"));
		const postRoutes = createPostRoutes();
		const jobRoutes = createJobRoutes();
		const feedRoutes = createFeedRoutes();
		const searchRoutes = createSearchRoutes();
		const bookmarkRoutes = createBookmarkRoutes();

		server.use("/api/v1/posts", postRoutes);
		server.use("/api/v1/jobs", jobRoutes);
		server.use("/api/v1/feed", feedRoutes);
		server.use("/api/v1/search", searchRoutes);
		server.use("/api/v1/bookmarks", bookmarkRoutes);
	}
	private setupErrorHandlers(server: Express) {
		server.use(ResponseMiddleware.handler);
	}
}
