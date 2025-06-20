import {
  Controller,
  Post,
  Body,
  Get,
  HttpException,
  HttpStatus,
  Patch,
  UnauthorizedException,
  Put,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { LoginAuthDto, LoginAuthedUserDto, RefreshTokenDto } from './models/login-auth.model';
import { RegistrationAuthDto } from './models/register-auth.model';
import { CurrentUser } from '@src/shared/access/decorators/current-user.decorator';
import { ApiResponse } from '@nestjs/swagger';
import { UserDto } from '../user/models/user.model';
import { ApplyGuard } from '@src/shared/access/decorators/apply-guard.decorator';
import { EGuardType } from '@src/shared/access/guard-type.enum';
import { ChangePasswordAuthBodyDto } from './models/change-password-auth.model';
import { UpdateProfileAuthDto } from './models/update-profile.auth';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

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
    type: UserDto,
  })
  @Post('register')
  async register(@Body() registerData: RegistrationAuthDto): Promise<UserDto> {
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
  async refreshToken(@Body() body: RefreshTokenDto): Promise<LoginAuthedUserDto> {
    if (!body.refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const result = await this.authService.refreshToken(body);
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
    type: UserDto,
  })
  @Get('profile')
  @ApplyGuard(EGuardType.JWT)
  async getProfile(@CurrentUser('id') userId: string): Promise<UserDto> {
    const result = await this.userService.findById({ id: userId });
    if (!result.success) {
      throw new HttpException(result.error || 'User not found', HttpStatus.NOT_FOUND);
    }

    return result.data;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    type: UserDto,
  })
  @Put('profile')
  @ApplyGuard(EGuardType.JWT)
  async updateProfile(@CurrentUser('id') userId: string, @Body() updateData: UpdateProfileAuthDto): Promise<UserDto> {
    const result = await this.userService.updateUser({ id: userId }, updateData);
    if (!result.success) {
      throw new HttpException(result.error || 'User not found', HttpStatus.NOT_FOUND);
    }

    return result.data;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile updated successfully',
  })
  @Patch('profile/password')
  @ApplyGuard(EGuardType.JWT)
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() body: ChangePasswordAuthBodyDto,
  ): Promise<HttpStatus> {
    const result = await this.authService.changePassword({ id: userId }, body);

    if (!result.success) {
      throw new HttpException(result.error || 'Password change failed', HttpStatus.BAD_REQUEST);
    }

    return HttpStatus.OK;
  }
}
