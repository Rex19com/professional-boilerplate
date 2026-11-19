
import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { config } from '../config/env';
import { logger } from '../utils/logger';

// Global error handler
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let isOperational = false;
    let details: any = undefined;

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        errorCode = err.errorCode;
        message = err.message;
        isOperational = err.isOperational;

        if (err instanceof ValidationError) {
            details = err.details;
        }
    } else if (err.name === 'QueryFailedError') {
        statusCode = 400;
        errorCode = 'DATABASE_ERROR';
        message = 'Database operation failed';
    } else if (err instanceof SyntaxError && 'body' in err) {
        statusCode = 400;
        errorCode = 'INVALID_JSON';
        message = 'Invalid JSON in request body';
        isOperational = true;
    }

    if (isOperational) {
        logger.warn(`Operational error: ${message}`, {
            errorCode,
            path: req.path,
            method: req.method,
        });
    } else {
        logger.error('Unexpected error', {
            error: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
        });
    }

    res.status(statusCode).json({
        success: false,
        error: {
            code: errorCode,
            message,
            ...(details && { details }),
            ...(config.isDev && { stack: err.stack }),
        },
    });
};

// 404 Not Found handler
export const notFoundHandler = (
    req: Request,
    res: Response
): void => {
    res.status(404).json({
        success: false,
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: `Route ${req.method} ${req.originalUrl} not found`,
        },
    });
};
