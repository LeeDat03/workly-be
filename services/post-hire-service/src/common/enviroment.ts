import path from 'path';
import dotenv from 'dotenv-safe';

dotenv.config({
    path: path.join(__dirname, '../../.env'),
    sample: path.join(__dirname, '../../.env.example'),
    allowEmptyValues: true,
});

export const LOG_LEVEL = process.env.LOG_LEVEL || 'debug';
export const NODE_ENV = process.env.NODE_ENV || 'DEV';
export const PORT = process.env.PORT || 8004;
export const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
export const MONGODB_NAME = process.env.MONGODB_DB_NAME || 'workly-be'