import {
  Controller,
  Post,
  Body,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto, LoginAuthedUserDto } from './models/login-auth.model';
import { RegisterAuthDto } from './models/register-auth.model';
import { ERoleUser } from '@src/shared/access/roles/role.enum';
import { CurrentUser } from '@src/shared/access/decorators/current-user.decorator';
import { ApiResponse } from '@nestjs/swagger';
import { AuthedUserDto } from './models/auth.model';
import { ApplyGuard } from '@src/shared/access/decorators/apply-guard.decorator';
import { EGuardType } from '@src/shared/access/guard-type.enum';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully logged in',
    type: LoginAuthedUserDto,
  })
  @Post('login')
  async login(@Body() loginData: LoginAuthDto): Promise<LoginAuthedUserDto> {
    const result = await this.authService.login(loginData);
    if (!result.success) {
      throw new HttpException(result.error || 'Authentication failed', HttpStatus.UNAUTHORIZED);
    }

    return result.data;
  }

  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered',
    type: AuthedUserDto,
  })
  @Post('register')
  async register(@Body() registerData: RegisterAuthDto): Promise<AuthedUserDto> {
    const result = await this.authService.register(registerData);
    if (!result.success) {
      throw new HttpException(result.error || 'Registration failed', HttpStatus.BAD_REQUEST);
    }

    return result.data;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token successfully refreshed',
    type: LoginAuthedUserDto,
  })
  @Post('refresh')
  async refreshToken(@Headers('refresh-token') refreshToken: string): Promise<LoginAuthedUserDto> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const result = await this.authService.refreshToken(refreshToken);
    if (!result.success) {
      throw new HttpException(result.error || 'Token refresh failed', HttpStatus.UNAUTHORIZED);
    }

    return result.data;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully logged out',
  })
  @Post('logout')
  @ApplyGuard(EGuardType.JWT)
  async logout(@CurrentUser('id') userId: string): Promise<HttpStatus> {
    const result = await this.authService.logout(userId);
    if (!result.success) {
      throw new HttpException(result.error || 'Logout failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return HttpStatus.OK;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    type: AuthedUserDto,
  })
  @Get('profile')
  @ApplyGuard(EGuardType.JWT)
  async getProfile(@CurrentUser('id') userId: string): Promise<AuthedUserDto> {
    const result = await this.authService.findById(userId);
    if (!result.success) {
      throw new HttpException(result.error || 'User not found', HttpStatus.NOT_FOUND);
    }

    return result.data;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile updated successfully',
  })
  @Patch('change-password')
  @ApplyGuard(EGuardType.JWT)
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() passwordData: { oldPassword: string; newPassword: string },
  ): Promise<HttpStatus> {
    const result = await this.authService.changePassword(userId, passwordData.oldPassword, passwordData.newPassword);

    if (!result.success) {
      throw new HttpException(result.error || 'Password change failed', HttpStatus.BAD_REQUEST);
    }

    return HttpStatus.OK;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users requiring activation retrieved successfully',
    type: [AuthedUserDto],
  })
  @Get('users-requiring-activation')
  @ApplyGuard(EGuardType.JWT, ERoleUser.ADMIN)
  async getUsersRequiringActivation(): Promise<AuthedUserDto[]> {
    const result = await this.authService.findUserRequiringActivation();

    if (!result.success) {
      throw new HttpException(
        result.error || 'Failed to fetch users requiring activation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return result.data;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully activated',
  })
  @Patch('activate/:id')
  @ApplyGuard(EGuardType.JWT, ERoleUser.ADMIN)
  async activateUser(@Param('id') id: string) {
    const result = await this.authService.activateUser(id);

    if (!result.success) {
      throw new HttpException(result.error || 'Activation failed', HttpStatus.BAD_REQUEST);
    }

    return HttpStatus.OK;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully deactivated',
  })
  @Patch('deactivate/:id')
  @ApplyGuard(EGuardType.JWT, ERoleUser.ADMIN)
  async deactivateUser(@Param('id') id: string): Promise<HttpStatus> {
    const result = await this.authService.deactivateUser(id);

    if (!result.success) {
      throw new HttpException(result.error || 'Deactivation failed', HttpStatus.BAD_REQUEST);
    }

    return HttpStatus.OK;
  }
}
