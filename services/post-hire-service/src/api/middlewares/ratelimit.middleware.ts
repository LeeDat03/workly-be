import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response } from 'express';
import { StatusCode } from '@/common/errors';
import { ResponseMiddleware } from './response.middleware';
import { APIError } from '@/common/error/api.error';

export class RateLimiterMiddleware {
    private static commonOptions = {
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req: Request) => {
            return ipKeyGenerator(req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.ip || '');
        },
    };

    /**
     * Handle rate limit error
     */
    static handleRateLimitError(req: Request, res: Response, minutesLeft: number): void {
        const message = `Too many requests. Please try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`;

        const error = new APIError({
            message,
            status: StatusCode.REQUEST_TOO_MANY,
            errorCode: 1,
            messageData: { minute: minutesLeft },
        });

        return ResponseMiddleware.handler(error, req, res, () => { });
    }

    /**
     * Global rate limiter
     */
    public static createGlobalLimiter() {
        const minute = 1;
        const timeout = minute * 60 * 1000;

        const options: Parameters<typeof rateLimit>[0] = {
            windowMs: timeout,
            max: 15,
            message: `Too many requests. Please try again in ${minute} minute.`,
            handler: (req: Request, res: Response) => {
                RateLimiterMiddleware.handleRateLimitError(req, res, minute);
            },
            ...this.commonOptions,
            skip: (req: Request) => req.method !== 'POST',
        };

        return rateLimit(options);
    }

    /**
     * Login-specific rate limiter
     */
    public static createLoginLimiter() {
        const minute = 5;
        const timeout = minute * 60 * 1000;

        const options: Parameters<typeof rateLimit>[0] = {
            windowMs: timeout,
            max: 15,
            message: `Too many login attempts. Please wait ${minute} minutes.`,
            handler: (req: Request, res: Response) => {
                RateLimiterMiddleware.handleRateLimitError(req, res, minute);
            },
            ...this.commonOptions,
        };

        return rateLimit(options);
    }
}