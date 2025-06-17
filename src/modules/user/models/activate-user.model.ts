import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty } from '@nestjs/swagger';

export const activateUserQueryModel = z.object({
  id: z.string().uuid('Invalid user ID'),
});
export type IActivateUserQuery = z.infer<typeof activateUserQueryModel>;
export class ActivateUserQueryDto extends createZodDto(activateUserQueryModel) {
  @ApiProperty({
    description: 'ID of the user to be activated',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;
}
