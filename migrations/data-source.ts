import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const MigrationDataSource = new DataSource({
  type: 'postgres',
  host: process.env.ENV__DB_HOST,
  port: Number(process.env.ENV__DB_PORT),
  username: process.env.ENV__DB_USER,
  password: process.env.ENV__DB_PASSWORD,
  database: process.env.ENV__DB_NAME,
  entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/!(data-source).{ts,js}'],
  synchronize: false,
  logging: true,
});
