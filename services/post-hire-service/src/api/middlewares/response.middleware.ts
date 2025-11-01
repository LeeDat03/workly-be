import { NODE_ENV } from "@/common/enviroment";
import { APIError } from "@/common/error/api.error";
import { StatusCode } from "@/common/errors";
import { NextFunction, Request, Response } from "express";

export class ResponseMiddleware {
    static handler(err: APIError, req: Request, res: Response, next: NextFunction): void {
        const { status = StatusCode.SERVER_ERROR, errorCode = 1, messageData } = err;

        let message = '';

        if (messageData && typeof err.message === 'string') {
            const data: Record<string, string> = messageData as Record<string, string>;

            message = err.message.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
                return data[key] ?? '';
            });
        } else if (typeof err.message === 'string') {
            message = err.message;
        } else {
            message = 'An unexpected error occurred.';
        }


        if (err.message.includes('Foreign key constraint violated')) {
            const violatedConstraint = err.message.match(/`([^`]+)_fkey/);
            const key = violatedConstraint ? violatedConstraint[1] : 'unknown_key';

            err.message = `Foreign key constraint violated on '${key}'`;
            err.status = StatusCode.BAD_REQUEST;
        }

        const response: any = {
            errorCode: errorCode,
            statusCode: err.status,
            message: err.message,
            stack: err.stack,
            errors: err.errors,
        };

        if (NODE_ENV !== 'development') {
            delete response.stack;
        }

        res.status(status);
        res.json(response);
        res.end();
    }
}