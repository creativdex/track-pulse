import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiResponse } from '@nestjs/swagger';
import { ApiKeyRequired } from '@src/shared/access/decorators/api-key.decorator';
import { CreateUserDto } from './models/create-user.model';
import { UserDto } from './models/user.model';
import { UpdateUserDto } from './models/update-user.model';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiResponse({
    status: HttpStatus.CREATED,
    type: UserDto,
    description: 'Create user',
  })
  @ApiKeyRequired()
  @Post()
  async createUser(@Body() body: CreateUserDto): Promise<UserDto> {
    const result = await this.userService.create(body);
    if (!result.success) {
      throw new Error(`Failed to create user: ${result.error}`);
    }
    return result.data;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    type: [UserDto],
    description: 'Get all users',
  })
  @ApiKeyRequired()
  @Get('all')
  async getAllUsers(): Promise<UserDto[]> {
    const result = await this.userService.findAll();
    if (!result.success) {
      throw new Error(`Failed to get all users: ${result.error}`);
    }
    return result.data;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    type: UserDto,
    description: 'Get user by ID',
  })
  @ApiKeyRequired()
  @Get(':id')
  async getUser(@Param('id') id: string): Promise<UserDto> {
    const result = await this.userService.findById(id);
    if (!result.success) {
      throw new Error(`Failed to get user: ${result.error}`);
    }
    return result.data;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    type: UserDto,
    description: 'Get user by Login',
  })
  @ApiKeyRequired()
  @Get('login/:login')
  async getUserByLogin(@Param('login') login: string): Promise<UserDto> {
    const result = await this.userService.findByLogin(login);
    if (!result.success) {
      throw new Error(`Failed to get user: ${result.error}`);
    }
    return result.data;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    type: UserDto,
    description: 'Get user by Login',
  })
  @ApiKeyRequired()
  @Patch(':id')
  async updateUserById(@Param('id') id: string, @Body() body: UpdateUserDto): Promise<UserDto> {
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
  @ApiKeyRequired()
  @Delete(':id')
  async deleteUserById(@Param('id') id: string): Promise<void> {
    await this.userService.delete(id);
  }
}
