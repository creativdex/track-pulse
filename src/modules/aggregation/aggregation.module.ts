import { Module } from '@nestjs/common';
import { YaTrackerClient } from '@src/shared/clients/ya-tracker/ya-tracker.client';
import { AggregationService } from './aggregation.service';
import { AggregationController } from './aggregation.controller';
import { UserTrackerModule } from '../tracker/user/user.module';
import { UserTrackerRateModule } from '../tracker/user-rate/user-rate.module';

@Module({
  imports: [UserTrackerModule, UserTrackerRateModule],
  controllers: [AggregationController],
  providers: [YaTrackerClient, AggregationService],
})
export class AggregationModule {}
