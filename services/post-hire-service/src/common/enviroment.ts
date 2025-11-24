import path from "path";
import dotenv from "dotenv-safe";

dotenv.config({
	path: path.join(__dirname, "../../.env"),
	sample: path.join(__dirname, "../../.env.example"),
	allowEmptyValues: true,
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