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
			cors: {
				origin: config.cors.allowedOrigins,
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
				origin: config.cors.allowedOrigins,
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
		// Serve static files from examples directory
		this.app.use("/examples", express.static("examples"));

		// API routes
		this.app.use("/api", routes);

		// Root endpoint
		this.app.get("/", (req: any, res: any) => {
			res.json({
				success: true,
				message: "Welcome to Workly Chat Service",
				version: "1.0.0",
				endpoints: {
					health: "/api/health",
					conversations: "/api/conversations",
					messages: "/api/messages",
					testClient: "/examples/socket-client.html",
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
