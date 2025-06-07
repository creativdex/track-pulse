import { Module } from '@nestjs/common';
import { YaTrackerClient } from './ya-tracker.client';

@Module({
  providers: [YaTrackerClient],
  exports: [YaTrackerClient],
})
export class YaTrackerModule {}
