import winston from "winston";
import chalk from "chalk";
import { omit } from "lodash";
import { LOG_LEVEL } from "@/common/enviroment";

const { combine, timestamp, printf } = winston.format;

// Custom styles for log levels
const logStyles: Record<
    string,
    { color: (msg: string) => string; emoji: string }
> = {
    info: {
        color: chalk.greenBright,
        emoji: "INFO: ",
    },
    warn: {
        color: chalk.yellowBright,
        emoji: "WARN: ",
    },
    error: {
        color: chalk.redBright,
        emoji: "ERROR: ",
    },
};

// Custom formatter
const customFormat = printf(({ level, message, timestamp, ...meta }) => {
    const style = logStyles[level] || {};
    const coloredLevel = style.color ? style.color(style.emoji + level.toUpperCase()) : level;

    // Safe stringify cho meta
    const metaString = Object.keys(meta).length
        ? "\n" + safeStringify(meta)
        : "";

    return `${chalk.gray(timestamp)} ${coloredLevel}: ${message}${metaString}`;
});

function safeStringify(obj: any) {
    try {
        return JSON.stringify(obj, getCircularReplacer(), 2);
    } catch {
        return "[Unserializable meta]";
    }
}

function getCircularReplacer() {
    const seen = new WeakSet();
    return (key: string, value: any) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) return "[Circular]";
            seen.add(value);
        }
        return value;
    };
}


// Create logger
const logger = winston.createLogger({
    level: LOG_LEVEL,
    format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        customFormat
    ),
    transports: [new winston.transports.Console()],
});

export default logger;
