import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty } from '@nestjs/swagger';

export const changePasswordAuthModelBody = z.object({
  oldPassword: z.string().min(6, 'Old password must be at least 6 characters long'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

export const changePasswordAuthQueryModel = z.object({
  id: z.string().uuid('Invalid user ID format'),
});

export type IChangePasswordAuthBody = z.infer<typeof changePasswordAuthModelBody>;
export type IChangePasswordAuthQuery = z.infer<typeof changePasswordAuthQueryModel>;

export class ChangePasswordAuthBodyDto extends createZodDto(changePasswordAuthModelBody) {
  @ApiProperty({
    description: 'Current password of the user',
    example: 'oldPassword123',
    minLength: 6,
  })
  oldPassword: string;

  @ApiProperty({
    description: 'New password for the user',
    example: 'newPassword123',
    minLength: 6,
  })
  newPassword: string;
}

export class ChangePasswordAuthQueryDto extends createZodDto(changePasswordAuthQueryModel) {
  @ApiProperty({
    description: 'ID of the user whose password is being changed',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;
}
