import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { UnauthorizedError } from '../utils/errors';
import { config } from '../config/env';
import { createLogger } from '../utils/logger';

const logger = createLogger('AuthService');
const userRepository = AppDataSource.getRepository(User);

interface LoginInput {
    email: string;
    password: string;
}

export interface TokenPayload {
    userId: string;
    email: string;
}

interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        name: string;
    };
}

export class AuthService {
    /**
     * Login user and generate JWT token
     */
    static async login(input: LoginInput): Promise<AuthResponse> {
        const { email, password } = input;

        // 1. Find user by email (explicitly select password in case entity has select: false)
        const user = await userRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.email = :email', { email })
            .getOne();

        if (!user) {
            logger.warn('Login attempt with non-existent email', { email });
            throw new UnauthorizedError('Invalid email or password');
        }

        // 2. Check if email is verified
        if (!user.isVerified) {
            logger.warn('Login attempt for unverified account', { email });
            throw new UnauthorizedError(
                'Please verify your email address before logging in. Check your inbox for the verification link.'
            );
        }

        // 3. Check if user is active
        if (user.isActive === false) {
            logger.warn('Login attempt for inactive account', { email });
            throw new UnauthorizedError('Account is deactivated');
        }

        // 4. Compare passwords with bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            logger.warn('Login attempt with wrong password', { email });
            throw new UnauthorizedError('Invalid email or password');
        }

        // 5. Generate JWT token
        const tokenPayload: TokenPayload = {
            userId: String(user.id),
            email: user.email,
        };

        const signOptions: SignOptions = {
            expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'],
        };

        const token = jwt.sign(tokenPayload, config.jwt.secret, signOptions);

        logger.info('User logged in successfully', { userId: user.id, email });

        // 6. Return token and user data (without password)
        return {
            token,
            user: {
                id: String(user.id),
                email: user.email,
                name: user.name,
            },
        };
    }

    /**
     * Verify JWT token and return decoded payload
     */
    static async verifyToken(token: string): Promise<TokenPayload> {
        try {
            const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
            return decoded;
        } catch (error) {
            const err = error as { name?: string };
            if (err.name === 'TokenExpiredError') {
                throw new UnauthorizedError('Token has expired');
            }
            if (err.name === 'JsonWebTokenError') {
                throw new UnauthorizedError('Invalid token');
            }
            throw new UnauthorizedError('Authentication failed');
        }
    }

    /**
     * Get user from token (useful for getting full user data)
     */
    static async getUserFromToken(token: string): Promise<User> {
        const decoded = await this.verifyToken(token);

        const user = await userRepository
            .createQueryBuilder('user')
            .where('user.id = :id', { id: decoded.userId })
            .getOne();

        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        if (user.isActive === false) {
            throw new UnauthorizedError('Account is deactivated');
        }

        return user;
    }
}