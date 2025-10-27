import { Neogma } from "neogma";
import { config } from "./index";
import logger from "../utils/logger";

class Neo4jDatabase {
	private neogma: Neogma | null = null;

	async connect(): Promise<void> {
		try {
			this.neogma = new Neogma(
				{
					url: config.neo4j.uri,
					username: config.neo4j.username,
					password: config.neo4j.password,
				},
				{
					logger: (level: string, message: string) => {
						if (level === "error") {
							logger.error(message);
						} else if (level === "warn") {
							logger.warn(message);
						} else {
							logger.debug(message);
						}
					},
				},
			);

			// Verify connectivity
			await this.neogma.verifyConnectivity();
			logger.info("Successfully connected to Neo4j database via Neogma");
		} catch (error) {
			logger.error("Failed to connect to Neo4j database:", error);
			throw error;
		}
	}

	async disconnect(): Promise<void> {
		if (this.neogma) {
			await this.neogma.driver.close();
			logger.info("Disconnected from Neo4j database");
		}
	}

	getNeogma(): Neogma {
		if (!this.neogma) {
			throw new Error("Database not initialized. Call connect() first.");
		}
		return this.neogma;
	}
}

export const database = new Neo4jDatabase();
