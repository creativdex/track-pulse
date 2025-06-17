import { Controller, Get, Post, Put, Delete, HttpException, HttpStatus, Param, Patch, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { ERoleUser } from '@src/shared/access/roles/role.enum';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApplyGuard } from '@src/shared/access/decorators/apply-guard.decorator';
import { EGuardType } from '@src/shared/access/guard-type.enum';
import { UserDto } from './models/user.model';
import { CreateUserBodyDto } from './models/create-user.model';
import { UpdateUserBodyDto, UpdateUserQueryDto } from './models/update-user.model';
import { UpdatePasswordUserBodyDto, UpdatePasswordUserQueryDto } from './models/udpate-password-user.model';
import { FindUserQueryByIdDto } from './models/find-user.model';
import { ActivateUserQueryDto } from './models/activate-user.model';
import { DeleteUserQueryDto } from './models/delete-user.model';

@ApiTags('users')
@Controller('users')
@ApplyGuard(EGuardType.JWT, ERoleUser.ADMIN)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
    type: [UserDto],
  })
  @Get()
  async getUsers(): Promise<UserDto[]> {
    const result = await this.userService.findAllUser();

    if (!result.success) {
      throw new HttpException(result.error || 'Failed to fetch users', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return result.data;
  }

  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully created',
    type: UserDto,
  })
  @Post()
  async createUser(@Body() createUserData: CreateUserBodyDto): Promise<UserDto> {
    const result = await this.userService.createUser(createUserData);

    if (!result.success) {
      throw new HttpException(result.error || 'Failed to create user', HttpStatus.BAD_REQUEST);
    }

    return result.data;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully',
    type: UserDto,
  })
  @Get(':id')
  async getUserById(@Param() params: FindUserQueryByIdDto): Promise<UserDto> {
    const result = await this.userService.findById(params);

    if (!result.success) {
      throw new HttpException(result.error || 'User not found', HttpStatus.NOT_FOUND);
    }

    return result.data;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully updated',
    type: UserDto,
  })
  @Put(':id')
  async updateUser(@Param() params: UpdateUserQueryDto, @Body() updateUserData: UpdateUserBodyDto): Promise<UserDto> {
    const result = await this.userService.updateUser(params, updateUserData);

    if (!result.success) {
      throw new HttpException(result.error || 'Failed to update user', HttpStatus.BAD_REQUEST);
    }

    return result.data;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User password successfully updated',
  })
  @Patch(':id/password')
  async updateUserPassword(
    @Param() params: UpdatePasswordUserQueryDto,
    @Body() passwordData: UpdatePasswordUserBodyDto,
  ): Promise<{ message: string }> {
    const result = await this.userService.updatePassword(params, passwordData);

    if (!result.success) {
      throw new HttpException(result.error || 'Failed to update password', HttpStatus.BAD_REQUEST);
    }

    return { message: 'Password updated successfully' };
  }

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully activated',
  })
  @Patch(':id/activate')
  async activateUser(@Param() params: ActivateUserQueryDto): Promise<void> {
    const result = await this.userService.activateUser(params);

    if (!result.success) {
      throw new HttpException(result.error || 'Activation failed', HttpStatus.BAD_REQUEST);
    }

    return;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully deactivated',
  })
  @Patch(':id/deactivate')
  async deactivateUser(@Param() params: ActivateUserQueryDto): Promise<void> {
    const result = await this.userService.deactivateUser(params);

    if (!result.success) {
      throw new HttpException(result.error || 'Deactivation failed', HttpStatus.BAD_REQUEST);
    }

    return;
  }

  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'User successfully deleted',
  })
  @Delete(':id')
  async deleteUser(@Param() params: DeleteUserQueryDto): Promise<void> {
    const result = await this.userService.deleteUser(params);

    if (!result.success) {
      throw new HttpException(result.error || 'Failed to delete user', HttpStatus.BAD_REQUEST);
    }

    return;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users requiring activation retrieved successfully',
    type: [UserDto],
  })
  @Get('pending-activation')
  async getUsersRequiringActivation(): Promise<UserDto[]> {
    const result = await this.userService.findUserRequiringActivation();

    if (!result.success) {
      throw new HttpException(result.error || 'Failed to fetch pending users', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return result.data;
  }
}
