import { Module } from '@nestjs/common';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      expandVariables: true,
    }),
    FeedbackModule,
  ],
})
export class AppModule {}
