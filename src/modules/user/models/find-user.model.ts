import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const findUserByIdQueryModel = z.object({
  id: z.string().uuid('Invalid user ID format').optional(),
});

export const findUserByLoginQueryModel = z.object({
  login: z.string().min(1, 'Login must not be empty').optional(),
});

export type IFindUserByIdQuery = z.infer<typeof findUserByIdQueryModel>;
export type IFindUserByLoginQuery = z.infer<typeof findUserByLoginQueryModel>;

export class FindUserQueryByIdDto extends createZodDto(findUserByIdQueryModel) {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    required: false,
    type: 'string',
  })
  id?: string;
}

export class FindUserQueryByLoginDto extends createZodDto(findUserByLoginQueryModel) {
  @ApiProperty({
    description: 'Login of the user',
    example: 'johndoe',
    required: false,
    type: 'string',
  })
  login?: string;
}
