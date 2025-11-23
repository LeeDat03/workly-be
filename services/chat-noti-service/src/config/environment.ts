import dotenv from "dotenv";

dotenv.config();

export const config = {
	port: process.env.PORT || 8005,
	nodeEnv: process.env.NODE_ENV || "development",
	mongodb: {
		uri: process.env.MONGODB_URI || "mongodb://localhost:27017/workly-chat",
	},
	cors: {
		allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || [
			"http://localhost:3000",
		],
	},
	jwt: {
		secret:
			process.env.JWT_SECRET ||
			"iz8oygerT+M/EJAn5gAtVQ6IHEe+HRwoXUtFlIJBe1o=",
	},
};
