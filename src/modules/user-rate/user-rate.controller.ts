import { BadRequestException, Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ApiKeyRequired } from '@src/shared/access/decorators/api-key.decorator';
import { UserRateService } from './user-rate.service';
import { CreateUserRateDto } from './models/create-user-rate.model';
import { UserRateDto } from './models/user-rate.model';

@Controller('user-rate')
export class UserRateController {
  constructor(private readonly userRateService: UserRateService) {}

  @ApiResponse({
    status: HttpStatus.OK,
    type: UserRateDto,
    description: 'Create user rate',
  })
  @ApiKeyRequired()
  @Post()
  async createUserRate(@Body() body: CreateUserRateDto): Promise<UserRateDto> {
    const result = await this.userRateService.create(body);
    if (!result.success) {
      throw new BadRequestException(`Failed to create user rate: ${result.error}`);
    }
    return result.data;
  }
}
