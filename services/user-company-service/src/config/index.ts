import dotenv from "dotenv";

dotenv.config();

export const config = {
	env: process.env.NODE_ENV || "development",
	port: parseInt(process.env.PORT || "8003", 10),

	neo4j: {
		uri: process.env.NEO4J_URI || "neo4j://localhost:7687",
		username: process.env.NEO4J_USERNAME || "neo4j",
		password: process.env.NEO4J_PASSWORD || "password",
		database: process.env.NEO4J_DATABASE || "neo4j",
	},

	cors: {
		origin: process.env.CORS_ORIGIN || "http://localhost:3000",
	},
} as const;
