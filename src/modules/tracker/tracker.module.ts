import { Module } from '@nestjs/common';
import { UserTrackerRateModule } from './user-rate/user-rate.module';
import { UserTrackerModule } from './user/user.module';
import { TrackerReferenceModule } from './reference/reference.module';

@Module({
  imports: [UserTrackerRateModule, UserTrackerModule, TrackerReferenceModule],
})
export class TrackerModule {}
