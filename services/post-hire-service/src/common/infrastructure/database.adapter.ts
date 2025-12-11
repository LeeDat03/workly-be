import { MongoClient, Db, Collection, Document } from "mongodb";
import logger from "@/common/logger";
import { MONGODB_NAME, MONGODB_URL } from "@/common/enviroment";

export class DatabaseAdapter {
	private static instance: DatabaseAdapter;
	private client: MongoClient;
	private db: Db | null = null;
	private readonly url: string;
	private readonly dbName: string;

	private constructor() {
		this.url = MONGODB_URL;
		this.dbName = MONGODB_NAME;

		this.client = new MongoClient(this.url, {
			maxPoolSize: 10,
			minPoolSize: 2,
			serverSelectionTimeoutMS: 5000,
		});
	}

	public static getInstance(): DatabaseAdapter {
		if (!DatabaseAdapter.instance) {
			DatabaseAdapter.instance = new DatabaseAdapter();
		}
		return DatabaseAdapter.instance;
	}

	public isConnected(): boolean {
		return this.db !== null;
	}

	async connect(): Promise<void> {
		try {
			await this.client.connect();
			this.db = this.client.db(this.dbName);

			await this.db.admin().ping();

			logger.info("Database connection established");
		} catch (error) {
			logger.error("Database connection failed:", error);
			throw error;
		}
	}

	async disconnect(): Promise<void> {
		try {
			await this.client.close();
			this.db = null;
			logger.info("Database connection closed");
		} catch (error) {
			logger.error("Error disconnecting from database:", error);
			throw error;
		}
	}

	getDatabase(): Db {
		if (!this.db) {
			throw new Error("Database not connected. Call connect() first.");
		}
		return this.db;
	}

	collection<T extends Document = Document>(name: string): Collection<T> {
		return this.getDatabase().collection<T>(name);
	}

	get post() {
		return this.collection("post");
	}

	get comment() {
		return this.collection("comment");
	}

	get like() {
		return this.collection("like");
	}
	get job() {
		return this.collection("job");
	}
	get candidate() {
		return this.collection("candidate");
	}
	get bookmark() {
		return this.collection("bookmark");
	}

	// Transaction support
	async withTransaction(
		callback: (session: any) => Promise<any>
	): Promise<any> {
		const session = this.client.startSession();
		try {
			let result: any;
			await session.withTransaction(async () => {
				result = await callback(session);
			});
			return result!;
		} finally {
			await session.endSession();
		}
	}
}
