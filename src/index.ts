import 'reflect-metadata';

import express, { Application, RequestHandler, ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { config } from './config/env';
import { AppDataSource } from './config/data-source';
import { logger } from './utils/logger';

import {
    errorHandler,
    notFoundHandler
} from './middleware/errorHandler';

import { requestLoggingMiddleware } from './middleware/requestLogger';

import { userRoutes } from './routes/userRoutes';
import { healthRoutes } from './routes/healthRoutes';

// ==========================================
// INITIALIZE EXPRESS
// ==========================================

const app: Application = express();

const unwrap = <T>(mod: T): T => {
    if (typeof mod === 'function') return mod;
    if (mod && typeof mod === 'object' && 'default' in mod) {
        const def = (mod as { default: unknown }).default;
        if (typeof def === 'function') return def as T;
    }
    return mod;
};

const helmetFn = unwrap(helmet) as typeof helmet;
const corsFn = unwrap(cors) as typeof cors;
const rateLimitFn = unwrap(rateLimit) as typeof rateLimit;

const apiLimiter = rateLimitFn({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});

// ==========================================
// GLOBAL MIDDLEWARE
// ==========================================

app.set('trust proxy', 1);

app.use(helmetFn() as RequestHandler);
app.use(corsFn() as RequestHandler);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/', apiLimiter as unknown as RequestHandler);
app.use(unwrap(requestLoggingMiddleware) as RequestHandler);

// ==========================================
// HEALTH CHECK ROUTE
// ==========================================

app.use('/health', unwrap(healthRoutes) as unknown as RequestHandler);

// ==========================================
// API ROUTES
// ==========================================

app.use('/api/users', unwrap(userRoutes) as unknown as RequestHandler);

// ==========================================
// 404 HANDLER
// ==========================================

app.use(unwrap(notFoundHandler) as RequestHandler);

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use(unwrap(errorHandler) as ErrorRequestHandler);

// ==========================================
// START SERVER
// ==========================================

const startServer = async () => {
    try {
        // Connect to MySQL Database
        await AppDataSource.initialize();

        logger.info('Database connected successfully');

        // Run migrations in production
        if (config.isProd) {
            await AppDataSource.runMigrations();

            logger.info('Migrations executed');
        }

        // Start Express Server
        const PORT = config.port || 3000;

        const server = app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
            logger.info(`Environment: ${config.env}`);
            logger.info(`Health check: http://localhost:${PORT}/health`);
        });

        // ==========================================
        // GRACEFUL SHUTDOWN
        // ==========================================

        const gracefulShutdown = async (signal: string) => {
            logger.info(`${signal} received. Starting graceful shutdown...`);

            server.close(async () => {
                logger.info('HTTP server closed');

                if (AppDataSource.isInitialized) {
                    await AppDataSource.destroy();
                    logger.info('Database connection closed');
                }

                logger.info('Graceful shutdown complete');

                process.exit(0);
            });

            setTimeout(() => {
                logger.error('Forced shutdown due to timeout');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // ==========================================
        // SERVER ERROR HANDLING
        // ==========================================

        server.on('error', (error: NodeJS.ErrnoException) => {
            logger.error('Server startup error', {
                error: error.message,
                code: error.code,
            });
        });
    } catch (error) {
        logger.error('Failed to start server:', error);

        process.exit(1);
    }
};

// ==========================================
// RUN APPLICATION
// ==========================================

startServer();

export default app;