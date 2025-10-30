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
					logger: (message: string) => {
						logger.debug(message);
					},
				},
			);

			// Verify connectivity
			await this.neogma.verifyConnectivity();
			logger.info("Successfully connected to Neo4j database via Neogma");

			await this.setupConstraints();
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

	async setupConstraints(): Promise<void> {
		if (!this.neogma) {
			throw new Error("Neogma not initialized.");
		}

		const queryRunner = this.neogma.queryRunner;

		try {
			await queryRunner.run(`
				CREATE CONSTRAINT user_id_unique IF NOT EXISTS
				FOR (u:User)
				REQUIRE u.userId IS UNIQUE
			`);
			await queryRunner.run(`
				CREATE CONSTRAINT comapany_id_unique IF NOT EXISTS
				FOR (c:Company)
				REQUIRE c.companyId IS UNIQUE
			`);

			logger.info("✅ Neo4j constraints successfully set up.");
		} catch (error) {
			logger.error("⚠️ Error setting up Neo4j constraints:", error);
			throw error;
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
