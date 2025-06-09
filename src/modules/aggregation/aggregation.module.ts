import { Module } from '@nestjs/common';
import { YaTrackerClient } from '@src/shared/clients/ya-tracker/ya-tracker.client';
import { AggregationService } from './aggregation.service';
import { AggregationController } from './aggregation.controller';

@Module({
  imports: [],
  controllers: [AggregationController],
  providers: [YaTrackerClient, AggregationService],
})
export class AggregationModule {}
