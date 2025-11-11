import { Request, Response, NextFunction } from 'express';
import { ApiError, logger } from '../utils';
import { config } from '../config';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = err;

  // Convert error to ApiError if not already
  if (!(error instanceof ApiError)) {
    const statusCode = 500;
    const message = config.nodeEnv === 'production' 
      ? 'Internal server error' 
      : error.message || 'Internal server error';
    error = new ApiError(statusCode, message, false, err.stack);
  }

  const apiError = error as ApiError;

  // Log error
  if (apiError.statusCode >= 500) {
    logger.error('Error:', {
      message: apiError.message,
      stack: apiError.stack,
      url: req.originalUrl,
      method: req.method,
    });
  } else {
    logger.warn('Error:', {
      message: apiError.message,
      url: req.originalUrl,
      method: req.method,
    });
  }

  // Send error response
  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    ...(config.nodeEnv === 'development' && { stack: apiError.stack }),
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = ApiError.notFound(`Route ${req.originalUrl} not found`);
  next(error);
};

