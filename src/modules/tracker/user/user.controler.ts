import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { UserTrackerService } from './user.service';
import { ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CreateUserTrackerDto } from './models/create-user.model';
import { UserTrackerDto } from './models/user.model';
import { UpdateUserTrackerDto } from './models/update-user.model';
import { ApplyGuard } from '@src/shared/access/decorators/apply-guard.decorator';
import { EGuardType } from '@src/shared/access/guard-type.enum';
import { EUserTrackerRateType } from '../user-rate/models/user-rate.model';

@Controller('users-tracker')
export class UserTrackerController {
  constructor(private readonly userService: UserTrackerService) {}

  @ApiResponse({
    status: HttpStatus.CREATED,
    type: UserTrackerDto,
    description: 'Create user',
  })
  @ApplyGuard(EGuardType.JWT)
  @Post()
  async createUser(@Body() body: CreateUserTrackerDto): Promise<UserTrackerDto> {
    const result = await this.userService.create(body);
    if (!result.success) {
      throw new Error(`Failed to create user: ${result.error}`);
    }
    return result.data;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    type: [UserTrackerDto],
    description: 'Get all users',
  })
  @ApiQuery({
    name: 'includeDismissed',
    required: false,
    type: Boolean,
    description: 'Include dismissed users in the response (default: false)',
    example: false,
  })
  @ApplyGuard(EGuardType.JWT)
  @Get('all')
  async getAllUsers(@Query('includeDismissed') includeDismissed?: string): Promise<UserTrackerDto[]> {
    const includeFlag = includeDismissed === 'true';
    const result = await this.userService.findAll(includeFlag);
    if (!result.success) {
      throw new Error(`Failed to get all users: ${result.error}`);
    }
    return result.data;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    type: UserTrackerDto,
    description: 'Get user by ID',
  })
  @ApplyGuard(EGuardType.JWT)
  @Get(':id')
  async getUser(@Param('id') id: string): Promise<UserTrackerDto> {
    const result = await this.userService.findById(id);
    if (!result.success) {
      throw new Error(`Failed to get user: ${result.error}`);
    }
    return result.data;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    type: UserTrackerDto,
    description: 'Get user by Tracker UID',
  })
  @ApplyGuard(EGuardType.JWT)
  @Get('tracker/:uid')
  async getUserByTrackerId(@Param('uid') uid: string): Promise<UserTrackerDto> {
    const result = await this.userService.findByTrackerUid(uid);
    if (!result.success) {
      throw new Error(`Failed to get user: ${result.error}`);
    }
    return result.data;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    type: UserTrackerDto,
    description: 'Get user by Login',
  })
  @ApplyGuard(EGuardType.JWT)
  @Get('login/:login')
  async getUserByLogin(@Param('login') login: string): Promise<UserTrackerDto> {
    const result = await this.userService.findByLogin(login);
    if (!result.success) {
      throw new Error(`Failed to get user: ${result.error}`);
    }
    return result.data;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    type: UserTrackerDto,
    description: 'Update user by ID',
  })
  @ApplyGuard(EGuardType.JWT)
  @Patch(':id')
  async updateUserById(@Param('id') id: string, @Body() body: UpdateUserTrackerDto): Promise<UserTrackerDto> {
    const result = await this.userService.update(id, body);
    if (!result.success) {
      throw new Error(`Failed to update user: ${result.error}`);
    }
    return result.data;
  }

  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Delete user by ID',
  })
  @ApplyGuard(EGuardType.JWT)
  @Delete(':id')
  async deleteUserById(@Param('id') id: string): Promise<void> {
    await this.userService.delete(id);
  }

  @ApiResponse({
    status: HttpStatus.OK,
    type: [UserTrackerDto],
    description: 'Get all users filtered by rate type',
  })
  @ApiQuery({
    name: 'rateType',
    required: true,
    enum: EUserTrackerRateType,
    description: 'Type of rate to filter by (GLOBAL, PROJECT, QUEUE)',
    example: EUserTrackerRateType.GLOBAL,
  })
  @ApiQuery({
    name: 'context',
    required: false,
    type: String,
    description: 'Context value for PROJECT/QUEUE rate types (project ID or queue name)',
    example: 'PROJECT-123',
  })
  @ApiQuery({
    name: 'includeDismissed',
    required: false,
    type: Boolean,
    description: 'Include dismissed users in the response (default: false)',
    example: false,
  })
  @ApplyGuard(EGuardType.JWT)
  @Get('by-rate-type')
  async getAllUsersByRateType(
    @Query('rateType') rateType: EUserTrackerRateType,
    @Query('context') context?: string,
    @Query('includeDismissed') includeDismissed?: string,
  ): Promise<UserTrackerDto[]> {
    const includeFlag = includeDismissed === 'true';
    const result = await this.userService.findAllByRateType(rateType, context, includeFlag);
    if (!result.success) {
      throw new Error(`Failed to get users by rate type: ${result.error}`);
    }
    return result.data;
  }
}
