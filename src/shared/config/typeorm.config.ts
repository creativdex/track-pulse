import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const typeOrmConfigFactory = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: configService.get('ENV__DB_TYPE') as 'mysql' | 'postgres' | 'sqlite' | 'mariadb',
  host: configService.get<string>('ENV__DB_HOST'),
  port: Number(configService.get<string>('ENV__DB_PORT')),
  username: configService.get<string>('ENV__DB_USER'),
  password: configService.get<string>('ENV__DB_PASSWORD'),
  database: configService.get<string>('ENV__DB_NAME'),
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../../migrations/*.ts'],
  synchronize: false, // Используем миграции вместо synchronize
  migrationsRun: true, // Автоматически запускать миграции при старте приложения
  logging: ['error', 'warn', 'migration'],
});
