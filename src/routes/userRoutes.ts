import { Router, RequestHandler } from 'express';
import { UserController } from '../controllers/userController';
import { validate } from '../middleware/validate';
import {
    createUserSchema,
    updateUserSchema,
    idParamSchema,
    paginationQuerySchema,
} from '../dto/user.dto';
import { asyncHandler } from '../utils/asyncHandler';

export const userRoutes = Router();

const checkHandlers = (routeLabel: string, ...handlers: unknown[]): RequestHandler[] => {
    handlers.forEach((fn, idx) => {
        if (typeof fn !== 'function') {
            console.error(`❌ BAD HANDLER in userRoutes [${routeLabel}] at index ${idx}:`, typeof fn, fn);
        }
    });
    return handlers as RequestHandler[];
};

userRoutes.get(
    '/',
    ...checkHandlers(
        'GET /',
        validate(paginationQuerySchema, 'query'),
        asyncHandler(UserController.getAll)
    )
);

userRoutes.get(
    '/:id',
    ...checkHandlers(
        'GET /:id',
        validate(idParamSchema, 'params'),
        asyncHandler(UserController.getById)
    )
);

userRoutes.post(
    '/',
    ...checkHandlers(
        'POST /',
        validate(createUserSchema),
        asyncHandler(UserController.create)
    )
);

userRoutes.put(
    '/:id',
    ...checkHandlers(
        'PUT /:id',
        validate(idParamSchema, 'params'),
        validate(updateUserSchema),
        asyncHandler(UserController.update)
    )
);

userRoutes.delete(
    '/:id',
    ...checkHandlers(
        'DELETE /:id',
        validate(idParamSchema, 'params'),
        asyncHandler(UserController.delete)
    )
);