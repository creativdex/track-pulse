import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { AggregationService } from './aggregation.service';
import { WorkloadProjectsSummaryDto, WorkloadQueryDto } from './models/workload-aggregation.model';
import { ApiResponse } from '@nestjs/swagger';
import { ApiKeyRequired } from '@src/shared/access/decorators/api-key.decorator';

@Controller('aggregation')
export class AggregationController {
  constructor(private readonly aggregationService: AggregationService) {}

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns workload data grouped by project',
    type: WorkloadProjectsSummaryDto,
  })
  @ApiKeyRequired()
  @Get('workload')
  async workload(@Query() query: WorkloadQueryDto): Promise<WorkloadProjectsSummaryDto> {
    const result = await this.aggregationService.workload(query);

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch workload data');
    }

    return result.data;
  }
}
