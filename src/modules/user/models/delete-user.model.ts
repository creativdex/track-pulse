import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty } from '@nestjs/swagger';

export const deleteUserQueryModel = z.object({
  id: z.string().uuid('Invalid user ID format'),
});
export type IDeleteUserQuery = z.infer<typeof deleteUserQueryModel>;
export class DeleteUserQueryDto extends createZodDto(deleteUserQueryModel) {
  @ApiProperty({
    description: 'Unique identifier of the user to be deleted',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    type: 'string',
  })
  id: string;
}
