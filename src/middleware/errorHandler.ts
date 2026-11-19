import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { config } from '../config/env';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: any = undefined;

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        errorCode = err.errorCode;
        message = err.message;

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
    }

    // TEMPORARY: we will replace this with the Winston logger in Phase 3
    console.error(`[${errorCode}] ${req.method} ${req.path}: ${err.message}`);

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

export const notFoundHandler = (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: `Route ${req.method} ${req.originalUrl} not found`,
        },
    });
};