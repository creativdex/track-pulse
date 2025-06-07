import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { YaTrackerClient } from '@src/shared/clients/ya-tracker/ya-tracker.client';

@Module({
  controllers: [FeedbackController],
  providers: [FeedbackService, YaTrackerClient],
})
export class FeedbackModule {}
