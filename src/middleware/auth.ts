import { Request, Response, NextFunction } from 'express';
import { AuthService, TokenPayload } from '../services/authService';
import { UnauthorizedError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('AuthMiddleware');

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new UnauthorizedError('No token provided');
        }

        if (!authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Invalid token format. Use: Bearer <token>');
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            throw new UnauthorizedError('No token provided');
        }

        const decoded = await AuthService.verifyToken(token);
        req.user = decoded;

        logger.debug('Token validated', { userId: decoded.userId });
        next();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            logger.warn('Authentication failed', {
                path: req.path,
                error: error.message,
            });
            next(error);
        } else {
            logger.error('Auth middleware error', { error });
            next(new UnauthorizedError('Authentication failed'));
        }
    }
};