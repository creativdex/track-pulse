import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { YaTrackerClient } from '@src/shared/clients/ya-tracker/ya-tracker.client';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [FeedbackController],
  providers: [FeedbackService, YaTrackerClient],
})
export class FeedbackModule {}
