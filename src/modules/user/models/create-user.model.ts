import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createUserBodyModel = z.object({
  login: z.string().min(3, 'Login is required'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export type ICreateUserBody = z.infer<typeof createUserBodyModel>;

export class CreateUserBodyDto extends createZodDto(createUserBodyModel) {
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

  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    required: false,
    type: 'string',
  })
  firstName?: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
    required: false,
    type: 'string',
  })
  lastName?: string;
}
