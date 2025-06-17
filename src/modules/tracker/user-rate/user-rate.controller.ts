import { BadRequestException, Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { UserTrackerRateService } from './user-rate.service';
import { CreateUserTrackerRateDto } from './models/create-user-rate.model';
import { UserTrackerRateDto } from './models/user-rate.model';
import { ApplyGuard } from '@src/shared/access/decorators/apply-guard.decorator';
import { EGuardType } from '@src/shared/access/guard-type.enum';
import { ERoleUser } from '@src/shared/access/roles/role.enum';

@Controller('user-tracker-rate')
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
}
