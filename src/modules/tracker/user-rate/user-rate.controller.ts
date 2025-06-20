import { BadRequestException, Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { UserTrackerRateService } from './user-rate.service';
import { CreateUserTrackerRateDto } from './models/create-user-rate.model';
import { UserTrackerRateDto } from './models/user-rate.model';
import { ApplyGuard } from '@src/shared/access/decorators/apply-guard.decorator';
import { EGuardType } from '@src/shared/access/guard-type.enum';
import { ERoleUser } from '@src/shared/access/roles/role.enum';
import { BatchRateUpdateResultDto } from './models/batch-rate-update-result.model';
import { BatchRateUpdateDto } from './models/batch-rate-update.model';

@Controller('users-tracker-rate')
export class UserTrackerRateController {
  constructor(private readonly userRateService: UserTrackerRateService) {}

  @ApiResponse({
    status: HttpStatus.OK,
    type: UserTrackerRateDto,
    description: 'Create user rate',
  })
  @ApplyGuard(EGuardType.JWT, ERoleUser.ADMIN)
  @Post()
  async createUserRate(@Body() body: CreateUserTrackerRateDto): Promise<UserTrackerRateDto> {
    const result = await this.userRateService.create(body);
    if (!result.success) {
      throw new BadRequestException(`Failed to create user rate: ${result.error}`);
    }
    return result.data;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    type: [BatchRateUpdateResultDto],
    description: 'Batch create user rates',
  })
  @ApplyGuard(EGuardType.JWT, ERoleUser.ADMIN)
  @Post('batch')
  async createUserRates(@Body() body: BatchRateUpdateDto): Promise<BatchRateUpdateResultDto[]> {
    const result = await this.userRateService.batchUpdateRates(body);
    if (!result.success) {
      throw new BadRequestException(`Failed to create user rates: ${result.error}`);
    }
    return result.data;
  }
}
