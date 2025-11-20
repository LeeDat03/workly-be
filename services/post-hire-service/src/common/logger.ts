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

const logger = winston.createLogger({
    level: LOG_LEVEL,
    transports: [new winston.transports.Console()],
});

export default logger;
