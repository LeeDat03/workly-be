import path from "path";
import dotenv from "dotenv";

dotenv.config({
	path: path.join(__dirname, "../../.env"),
});

export const LOG_LEVEL = process.env.LOG_LEVEL || "debug";
export const NODE_ENV = process.env.NODE_ENV || "DEV";
export const PORT = process.env.PORT || 8004;
export const MONGODB_URL =
	process.env.MONGODB_URL ||
	"mongodb+srv://admin:khai11082003@cluster0.g7qc7.mongodb.net/?appName=Cluster0";
export const MONGODB_NAME = process.env.MONGODB_DB_NAME || "workly-be";
export const REDIS_URI = process.env.REDIS_URI || "redis://localhost:6379";
export const JWT_SECRET = process.env.JWT_SECRET || "your-secret-here";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "90d";

export const USER_SERVICE_URL =
	process.env.USER_SERVICE_URL || "http://localhost:8003/api/v1";
export const RABBITMQ_URI =
	process.env.RABBITMQ_URL || "amqp://admin:admin@localhost:5672";

export const ELASTICSEARCH_CLOUD_ID =
	process.env.ELASTICSEARCH_CLOUD_ID ||
	"test:dXMtY2VudHJhbDEuZ2NwLmNsb3VkLmVzLmlvOjQ0MyRlNWZhNDU4YTg4ZWE0OGMyOGI5MzkzMjc1ZmU0YWUzNiRmMGUyOTc0ZGI3MzA0ZWFlOWVmNjU0NWViOGEzYWNlOA==";
export const ELASTICSEARCH_USERNAME =
	process.env.ELASTICSEARCH_USERNAME || "elastic";
export const ELASTICSEARCH_PASSWORD =
	process.env.ELASTICSEARCH_PASSWORD || "TPGg7pCfcAsu1zaC2FCdml7v";

export const ELASTICSEARCH_URL =
	process.env.ELASTICSEARCH_URL || "http://localhost:9200";
