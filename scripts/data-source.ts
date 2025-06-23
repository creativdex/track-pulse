import { DataSource } from 'typeorm';
import { UserEntity } from '../src/modules/user/user.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.ENV__DB_HOST,
  port: Number(process.env.ENV__DB_PORT),
  username: process.env.ENV__DB_USER,
  password: process.env.ENV__DB_PASSWORD,
  database: process.env.ENV__DB_NAME,
  entities: [UserEntity],
  synchronize: false, // Используй миграции для схемы
});
