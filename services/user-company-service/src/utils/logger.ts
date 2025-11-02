import { createLogger, format, transports } from "winston";
import { TransformableInfo } from "logform";

const { combine, timestamp, printf, colorize } = format;

const logFormat = printf(({ message, timestamp }: TransformableInfo) => {
	return `${timestamp} [UC-SERVICE]: ${message}`;
});

const logger = createLogger({
	level: "info",
	transports: [
		new transports.Console({
			format: combine(
				timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
				logFormat,
			),
		}),
	],
});

export default logger;
