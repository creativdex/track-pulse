import { Module } from '@nestjs/common';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { ConfigModule } from '@nestjs/config';
import { SyncModule } from './modules/sync/sync.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfigFactory } from './shared/database/typeorm.config';
import { ConfigService } from '@nestjs/config';
import { configModuleOptions } from './shared/config/config.module-options';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: typeOrmConfigFactory,
      inject: [ConfigService],
    }),
    ConfigModule.forRoot(configModuleOptions),
    FeedbackModule,
    SyncModule,
  ],
})
export class AppModule {}
