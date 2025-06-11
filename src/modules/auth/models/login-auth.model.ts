import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { AuthedUserShortDto, authedUserShortModel } from './auth.model';

export const loginAuthModel = z.object({
  login: z.string().min(3, 'Login is required'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export type ILoginAuth = z.infer<typeof loginAuthModel>;

export class LoginAuthDto extends createZodDto(loginAuthModel) {
  @ApiProperty({
    description: 'Login of the user',
    example: 'john_doe',
    minLength: 3,
  })
  login: string;

  @ApiProperty({
    description: 'Password of the user',
    example: 'password123',
    minLength: 6,
  })
  password: string;
}

export const refreshTokenModel = z.object({
  refreshToken: z.string().min(20, 'Refresh token is required'),
});

export type IRefreshToken = z.infer<typeof refreshTokenModel>;

export class RefreshTokenDto extends createZodDto(refreshTokenModel) {
  @ApiProperty({
    description: 'Refresh token for the user',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}

export const loginAuthedUserModel = z.object({
  accessToken: z.string().min(20, 'Access token is required'),
  refreshToken: z.string().min(20, 'Refresh token is required'),
  user: authedUserShortModel,
});

export type ILoginAuthedUser = z.infer<typeof loginAuthedUserModel>;
export class LoginAuthedUserDto extends createZodDto(loginAuthedUserModel) {
  @ApiProperty({
    description: 'Access token for the user',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token for the user',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Authenticated user information',
    type: AuthedUserShortDto,
  })
  user: AuthedUserShortDto;
}
