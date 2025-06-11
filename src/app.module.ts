import { Module } from '@nestjs/common';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { ConfigModule } from '@nestjs/config';
import { SyncModule } from './modules/sync/sync.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfigFactory } from './shared/config/typeorm.config';
import { ConfigService } from '@nestjs/config';
import { configModuleOptions } from './shared/config/config.module-options';
import { UserRateModule } from './modules/user-rate/user-rate.module';
import { UserModule } from './modules/user/user.module';
import { AggregationModule } from './modules/aggregation/aggregation.module';
import { AuthModule } from './modules/auth/auth.module';

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
    UserRateModule,
    UserModule,
    AggregationModule,
    AuthModule,
  ],
})
export class AppModule {}
