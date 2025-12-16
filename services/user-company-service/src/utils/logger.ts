import { createLogger, format, transports } from "winston";
import { TransformableInfo } from "logform";

const { combine, timestamp, printf, colorize, errors } = format;

const isProduction = process.env.NODE_ENV === "production";

// Simple readable format
const logFormat = printf(
	({ level, message, timestamp, stack }: TransformableInfo) => {
		const formattedMessage = stack || message;
		return `${timestamp} [UC-SERVICE] ${level.toUpperCase()}: ${formattedMessage}`;
	},
);

const logger = createLogger({
	level: process.env.LOG_LEVEL || "info",
	format: combine(
		errors({ stack: true }), // Handle error objects
		timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
	),
	transports: [
		new transports.Console({
			format: isProduction
				? logFormat // No colors in production (clean Docker logs)
				: combine(colorize(), logFormat), // Colors in development
		}),
	],
});

export default logger;
