import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { NotFoundError, ConflictError } from '../utils/errors';
import bcrypt from 'bcrypt';
import { createLogger } from '../utils/logger';

const logger = createLogger('UserService');

interface FindAllOptions {
    page: number;
    limit: number;
    sort: string;
    order: 'ASC' | 'DESC';
}

export class UserService {
    private static getRepository() {
        return AppDataSource.getRepository(User);
    }

    static async findAll(options: FindAllOptions): Promise<[User[], number]> {
        const { page, limit, sort, order } = options;
        const skip = (page - 1) * limit;
        const allowedSortFields = ['id', 'name', 'email', 'isActive', 'age', 'createdAt', 'updatedAt'];
        const safeSort = allowedSortFields.includes(sort) ? sort : 'createdAt';

        return this.getRepository().findAndCount({
            select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
                age: true,
                createdAt: true,
                updatedAt: true,
            },
            order: { [safeSort]: order } as Record<string, 'ASC' | 'DESC'>,
            skip,
            take: limit,
        });
    }

    static async findById(id: number): Promise<User> {
        const user = await this.getRepository().findOne({
            where: { id } as any,
            select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
                age: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new NotFoundError(`User with id ${id} not found`);
        }

        return user;
    }

    static async create(data: {
        name: string;
        email: string;
        password: string;
        age?: number;
    }): Promise<User> {
        const repo = this.getRepository();
        const existing = await repo.findOne({
            where: { email: data.email },
        });

        if (existing) {
            throw new ConflictError('A user with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = repo.create({
            ...data,
            password: hashedPassword,
        });

        const savedUser = await repo.save(user);
        delete (savedUser as any).password;

        return savedUser;
    }

    static async update(id: number, data: Partial<User>): Promise<User> {
        const repo = this.getRepository();
        const user = await repo.findOne({ where: { id } as any });

        if (!user) {
            throw new NotFoundError(`User with id ${id} not found`);
        }

        if (data.email && data.email !== user.email) {
            const existing = await repo.findOne({
                where: { email: data.email },
            });

            if (existing) {
                throw new ConflictError('A user with this email already exists');
            }
        }

        Object.assign(user, data);

        return repo.save(user);
    }

    static async delete(id: number): Promise<void> {
        const repo = this.getRepository();
        const user = await repo.findOne({ where: { id } as any });

        if (!user) {
            throw new NotFoundError(`User with id ${id} not found`);
        }

        await repo.remove(user);
    }
}