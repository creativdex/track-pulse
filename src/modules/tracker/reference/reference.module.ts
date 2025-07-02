import { Module } from '@nestjs/common';
import { TrackerReferenceService } from './reference.service';
import { TrackerReferenceController } from './reference.controller';
import { YaTrackerClient } from '@src/shared/clients/ya-tracker/ya-tracker.client';

@Module({
  controllers: [TrackerReferenceController],
  providers: [TrackerReferenceService, YaTrackerClient],
  exports: [TrackerReferenceService],
})
export class TrackerReferenceModule {}
