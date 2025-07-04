import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const userModel = z.object({
  id: z.string().uuid(),
  login: z.string().min(3, 'Login is required'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.string(),
  isActive: z.boolean(),
  lastLoginAt: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type IUser = z.infer<typeof userModel>;

export class UserDto extends createZodDto(userModel) {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    type: 'string',
  })
  id: string;

  @ApiProperty({
    description: 'Login of the user',
    example: 'john_doe',
    minLength: 3,
  })
  login: string;

  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    required: false,
  })
  firstName?: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
    required: false,
  })
  lastName?: string;

  @ApiProperty({
    description: 'Role of the user',
    example: 'admin',
    required: true,
  })
  role: string;

  @ApiProperty({
    description: 'Indicates if the user is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Last login date and time of the user',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  lastLoginAt?: Date | null;

  @ApiProperty({
    description: 'Creation date and time of the user record',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last updated date and time of the user record',
    type: 'string',
    format: 'date-time',
  })
  updatedAt: Date;
}
