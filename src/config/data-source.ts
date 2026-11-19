
import 'reflect-metadata';
import path from 'path';
import { DataSource } from 'typeorm';
import { config } from './env';
import { User } from '../entities/User';

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: config.db.host,
    port: config.db.port,
    username: config.db.username,
    password: config.db.password,
    database: config.db.database,
    synchronize: false,
    logging: config.isDev ? ['error', 'warn'] : ['error'],
    entities: [User],
    migrations: [path.join(__dirname, '../migrations/*.{ts,js}')],
    subscribers: [],
    extra: {
        connectionLimit: 10,
    },
});
