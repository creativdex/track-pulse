import { Module } from '@nestjs/common';
import { YaTrackerClient } from '@src/shared/clients/ya-tracker/ya-tracker.client';
import { AggregationService } from './aggregation.service';
import { AggregationController } from './aggregation.controller';
import { UserTrackerModule } from '../tracker/user/user.module';

@Module({
  imports: [UserTrackerModule],
  controllers: [AggregationController],
  providers: [YaTrackerClient, AggregationService],
})
export class AggregationModule {}
