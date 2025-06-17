import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty } from '@nestjs/swagger';

export const updatePasswordUserBodyModel = z.object({
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

export const updatePasswordUserQueryModel = z.object({
  id: z.string().uuid('Invalid user ID'),
});

export type IUpdatePasswordUserBody = z.infer<typeof updatePasswordUserBodyModel>;
export type IUpdatePasswordUserQuery = z.infer<typeof updatePasswordUserQueryModel>;

export class UpdatePasswordUserBodyDto extends createZodDto(updatePasswordUserBodyModel) {
  @ApiProperty({
    description: 'New password for the user',
    example: 'newSecurePassword123',
  })
  newPassword: string;
}
export class UpdatePasswordUserQueryDto extends createZodDto(updatePasswordUserQueryModel) {
  @ApiProperty({
    description: 'ID of the user whose password is being updated',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;
}
