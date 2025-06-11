import { BadRequestException, Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { UserRateService } from './user-rate.service';
import { CreateUserRateDto } from './models/create-user-rate.model';
import { UserRateDto } from './models/user-rate.model';
import { ApplyGuard } from '@src/shared/access/decorators/apply-guard.decorator';
import { EGuardType } from '@src/shared/access/guard-type.enum';
import { ERoleUser } from '@src/shared/access/roles/role.enum';

@Controller('user-rate')
export class UserRateController {
  constructor(private readonly userRateService: UserRateService) {}

  @ApiResponse({
    status: HttpStatus.OK,
    type: UserRateDto,
    description: 'Create user rate',
  })
  @ApplyGuard(EGuardType.JWT, ERoleUser.ADMIN)
  @Post()
  async createUserRate(@Body() body: CreateUserRateDto): Promise<UserRateDto> {
    const result = await this.userRateService.create(body);
    if (!result.success) {
      throw new BadRequestException(`Failed to create user rate: ${result.error}`);
    }
    return result.data;
  }
}
