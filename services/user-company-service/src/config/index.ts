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

	jwt: {
		secret: process.env.JWT_SECRET || "fallback_secret",
		expiresIn: process.env.JWT_EXPIRES_IN || "90d",
	},

	mail: {
		host: process.env.MAIL_HOST!,
		port: Number(process.env.MAIL_PORT),
		user: process.env.MAIL_USER!,
		pass: process.env.MAIL_PASS!,
		fromEmail: process.env.MAIL_FROM_EMAIL!,
		fromName: process.env.MAIL_FROM_NAME!,
	},
} as const;
