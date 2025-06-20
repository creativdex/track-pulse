import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { AggregationService } from './aggregation.service';
import { WorkloadDto, WorkloadQueryDto } from './models/workload-aggregation.model';
import { ApiResponse } from '@nestjs/swagger';
import { ApplyGuard } from '@src/shared/access/decorators/apply-guard.decorator';
import { EGuardType } from '@src/shared/access/guard-type.enum';
import { ERoleUser } from '@src/shared/access/roles/role.enum';

@Controller('aggregations')
export class AggregationController {
  constructor(private readonly aggregationService: AggregationService) {}

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns workload data grouped by project',
    type: WorkloadDto,
  })
  @ApplyGuard(EGuardType.JWT, ERoleUser.ADMIN)
  @Get('workload')
  async workload(@Query() query: WorkloadQueryDto): Promise<WorkloadDto> {
    const result = await this.aggregationService.workload(query);

    console.log('Workload aggregation result:', result);

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch workload data');
    }

    return result.data;
  }
}
