import { StatusCode, ErrorCode } from '@/common/errors';
import { errors } from 'express-validation';

interface APIErrorParams {
    message: string;
    errors?: errors | string[]; // Allow errors to be either an 'errors' object or a string array
    stack?: string;
    errorCode?: number;
    status?: number;
    isPublic?: boolean;
    messageData?: object | null;
}

/**
 * Class representing an API error.
 */
export class APIError extends Error {
    public status: number;
    public errorCode?: number;
    public isPublic: boolean;
    public errors?: errors | string[];
    // eslint-disable-next-line @typescript-eslint/ban-types
    public messageData?: object;
    public statusCode: number;

    /**
     * Creates an API error.
     * @param {APIErrorParams} params - API error parameters.
     */
    constructor({
        message,
        errors,
        stack,
        errorCode,
        status = StatusCode.SERVER_ERROR,
        isPublic = false,
        messageData = null,
    }: APIErrorParams) {
        super(message);

        this.stack = stack;
        this.status = status;
        this.isPublic = isPublic;
        this.errors = errors;
        this.statusCode = status;

        if (errorCode === undefined || errorCode === 0) {
            this.errorCode = status >= 500 ? ErrorCode.SERVER_ERROR : ErrorCode.VERIFY_FAILED;
        } else {
            this.errorCode = errorCode;
        }
        this.messageData = messageData as Record<string, any> | undefined;
    }
}
