import winston from 'winston';
import chalk from 'chalk';
import { omit } from 'lodash';
import { LOG_LEVEL } from '@/common/enviroment';

const { combine, timestamp, colorize, align, printf } = winston.format;

// Define styles for different log levels
const logStyles = {
    info: {
        color: chalk.greenBright,
        emoji: 'INFO: ',
    },
    warn: {
        color: chalk.yellowBright,
        emoji: 'WARN: ',
    },
    error: {
        color: chalk.redBright,
        emoji: 'ERROR: ',
    },
};

const format = combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    colorize(),
    // align(),
    printf((info) => {
        const style = logStyles[info.level as keyof typeof logStyles] || logStyles.info;
        const message = `${style.emoji} ${style.color(info.message as string)}`;
        const metadata = JSON.stringify(omit(info, ['timestamp', 'level', 'message']));

        const logOutput =
            metadata !== '{}'
                ? `${chalk.cyan(info.timestamp as string)} ${message}\n${chalk.yellowBright(metadata)}`
                : `${chalk.cyan(info.timestamp as string)} ${message}`;

        return logOutput;
    }),
);

const logger = winston.createLogger({
    level: LOG_LEVEL,
    format,
    transports: [new winston.transports.Console()],
});

export default logger;
