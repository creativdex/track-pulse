import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { YaTrackerClient } from './ya-tracker.client';

@Module({
  imports: [ConfigModule],
  providers: [YaTrackerClient],
  exports: [YaTrackerClient],
})
export class YaTrackerModule {}
