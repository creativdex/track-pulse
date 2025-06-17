import { Module } from '@nestjs/common';
import { UserTrackerRateModule } from './user-rate/user-rate.module';
import { UserTrackerModule } from './user/user.module';

@Module({
  imports: [UserTrackerRateModule, UserTrackerModule],
})
export class TrackerModule {}
