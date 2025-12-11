import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer, Server as HttpServer } from "http";
import { Server } from "socket.io";
import { config } from "./config";
import routes from "./routes";
import { errorHandler, notFound } from "./middlewares";
import { logger } from "./utils";

export class App {
	public app: Application;
	public httpServer: HttpServer;
	public io: Server;

	constructor() {
		this.app = express();
		this.httpServer = createServer(this.app);
		this.io = new Server(this.httpServer, {
			path: '/api/v1/socket.io/',
			cors: {
				origin: (origin, callback) => {
					// Allow requests with no origin
					if (!origin) return callback(null, true);

					// In development, allow all localhost origins
					if (
						config.nodeEnv === "development" &&
						origin.includes("localhost")
					) {
						return callback(null, true);
					}

					// Check against allowed origins
					if (config.cors.allowedOrigins.includes(origin)) {
						callback(null, true);
					} else {
						callback(null, false);
					}
				},
				methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
				allowedHeaders: [
					"Content-Type",
					"Authorization",
					"X-Requested-With",
					"x-user-id",
					"x-user-type",
				],
				credentials: true,
			},
		});

		this.initializeMiddlewares();
		this.initializeRoutes();
		this.initializeErrorHandling();
	}

	private initializeMiddlewares(): void {
		// CORS - Allow specific origins with credentials
		this.app.use(
			cors({
				origin: (origin, callback) => {
					// Allow requests with no origin (like mobile apps or curl)
					if (!origin) return callback(null, true);

					// In development, allow all localhost origins
					if (
						config.nodeEnv === "development" &&
						origin.includes("localhost")
					) {
						return callback(null, true);
					}

					// Check against allowed origins
					if (config.cors.allowedOrigins.includes(origin)) {
						callback(null, true);
					} else {
						callback(new Error("Not allowed by CORS"));
					}
				},
				credentials: true,
				methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
				allowedHeaders: [
					"Content-Type",
					"Authorization",
					"x-user-id",
					"x-user-type",
				],
			})
		);

		// Cookie parser
		this.app.use(cookieParser());

		// Body parser
		this.app.use(express.json());
		this.app.use(express.urlencoded({ extended: true }));

		// Request logging
		this.app.use((req: any, res: any, next: any) => {
			logger.info(`${req.method} ${req.path}`);
			next();
		});
	}

	private initializeRoutes(): void {
		// API routes - version 1
		this.app.use("/api/v1", routes);

		// Root endpoint
		this.app.get("/", (req: any, res: any) => {
			res.json({
				success: true,
				message: "Welcome to Workly Chat Service",
				version: "1.0.0",
				endpoints: {
					health: "/api/v1/health",
					conversations: "/api/v1/conversations",
					messages: "/api/v1/messages",
				},
			});
		});
	}

	private initializeErrorHandling(): void {
		// 404 handler
		this.app.use(notFound);

		// Global error handler
		this.app.use(errorHandler);
	}

	public getServer(): HttpServer {
		return this.httpServer;
	}

	public getSocketIO(): Server {
		return this.io;
	}
}
