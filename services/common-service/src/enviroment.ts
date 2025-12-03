export const RABBITMQ_URI = process.env.RABBITMQ_URL || "amqp://admin:admin@localhost:5672"
export const MONGODB_URL =
    process.env.MONGODB_URL ||
    "mongodb+srv://admin:khai11082003@cluster0.g7qc7.mongodb.net/?appName=Cluster0";
export const MONGODB_NAME = process.env.MONGODB_DB_NAME || "workly-be";