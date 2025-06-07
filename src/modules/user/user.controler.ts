import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiResponse } from '@nestjs/swagger';
import { ApiKeyRequired } from '@src/shared/access/decorators/api-key.decorator';
import { CreateUserDto } from './models/create-user.model';
import { UserDto } from './models/user.model';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiResponse({
    status: HttpStatus.OK,
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
  @Post('all')
  async getAllUsers(): Promise<UserDto[]> {
    const result = await this.userService.findAll();
    if (!result.success) {
      throw new Error(`Failed to get all users: ${result.error}`);
    }
    return result.data;
  }
}
