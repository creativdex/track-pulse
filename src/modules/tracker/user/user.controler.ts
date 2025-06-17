import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { UserTrackerService } from './user.service';
import { ApiResponse } from '@nestjs/swagger';
import { CreateUserTrackerDto } from './models/create-user.model';
import { UserTrackerDto } from './models/user.model';
import { UpdateUserTrackerDto } from './models/update-user.model';
import { ApplyGuard } from '@src/shared/access/decorators/apply-guard.decorator';
import { EGuardType } from '@src/shared/access/guard-type.enum';

@Controller('user-tracker')
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
  @ApplyGuard(EGuardType.JWT)
  @Get('all')
  async getAllUsers(): Promise<UserTrackerDto[]> {
    const result = await this.userService.findAll();
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
    description: 'Get user by Login',
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
}
