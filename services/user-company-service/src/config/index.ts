import dotenv from "dotenv";
import z from "zod";

dotenv.config();

const envSchema = z.object({
	JWT_SECRET: z.string(),
	JWT_EXPIRES_IN: z.string().default("90d"),
});

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

	jwt: {
		secret: process.env.JWT_SECRET || "fallback_secret",
		expiresIn: process.env.JWT_EXPIRES_IN || "90d",
	},
} as const;
