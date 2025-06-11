import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const reagisterAuthModel = z.object({
  login: z.string().min(3, 'Login is required'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export type IRegisterAuth = z.infer<typeof reagisterAuthModel>;

export class RegisterAuthDto {
  @ApiProperty({
    description: 'Login of the user',
    example: 'john_doe',
    minLength: 3,
    required: true,
    type: 'string',
  })
  login: string;

  @ApiProperty({
    description: 'Password of the user',
    example: 'password123',
    minLength: 6,
    required: true,
    type: 'string',
  })
  password: string;
}
