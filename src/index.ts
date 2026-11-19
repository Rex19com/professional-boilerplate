import 'reflect-metadata';
import express from 'express';
import { config } from './config/env';
import { asyncHandler } from './utils/asyncHandler';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import {
    NotFoundError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    TooManyRequestsError,
    InternalError,
} from './utils/errors';

const app = express();
app.use(express.json());

// TEMPORARY TEST ROUTES (we will delete these in Phase 6)
app.get('/test/not-found', asyncHandler(async () => { throw new NotFoundError('User', 5); }));
app.get('/test/validation', asyncHandler(async () => { throw new ValidationError('Invalid data', [{ field: 'email', message: 'Email is required' }]); }));
app.get('/test/unauthorized', asyncHandler(async () => { throw new UnauthorizedError(); }));
app.get('/test/forbidden', asyncHandler(async () => { throw new ForbiddenError(); }));
app.get('/test/conflict', asyncHandler(async () => { throw new ConflictError('Email already exists'); }));
app.get('/test/too-many', asyncHandler(async () => { throw new TooManyRequestsError(); }));
app.get('/test/internal', asyncHandler(async () => { throw new InternalError(); }));
app.get('/test/crash', asyncHandler(async () => { throw new Error('Unexpected bug!'); }));

// Must be last
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
    console.log(`Test server running on http://localhost:${config.port}`);
});