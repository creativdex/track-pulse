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
  synchronize: true, // Не используйте в production!
});
