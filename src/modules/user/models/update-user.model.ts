import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateUserBodyModel = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateUserQueryModel = z.object({
  id: z.string().uuid('Invalid user ID format').optional(),
});

export type IUpdateUserBody = z.infer<typeof updateUserBodyModel>;
export type IUpdateUserQuery = z.infer<typeof updateUserQueryModel>;

export class UpdateUserBodyDto extends createZodDto(updateUserBodyModel) {
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

  @ApiProperty({
    description: 'Role of the user',
    example: 'admin',
    required: false,
    type: 'string',
  })
  role?: string;

  @ApiProperty({
    description: 'Is the user active?',
    example: true,
    required: false,
    type: 'boolean',
  })
  isActive?: boolean;
}

export class UpdateUserQueryDto extends createZodDto(updateUserQueryModel) {
  @ApiProperty({
    description: 'User ID to update',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
    type: 'string',
  })
  id?: string;
}
