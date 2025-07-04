import { Module } from '@nestjs/common';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { ConfigModule } from '@nestjs/config';
import { SyncModule } from './modules/sync/sync.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfigFactory } from './shared/config/typeorm.config';
import { ConfigService } from '@nestjs/config';
import { configModuleOptions } from './shared/config/config.module-options';
import { AggregationModule } from './modules/aggregation/aggregation.module';
import { AuthModule } from './modules/auth/auth.module';
import { TrackerModule } from './modules/tracker/tracker.module';
import { UserModule } from './modules/user/user.module';

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
    AggregationModule,
    TrackerModule,
    AuthModule,
    UserModule,
  ],
})
export class AppModule {}
