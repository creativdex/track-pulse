import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateProfileBodyModel = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
});

export type IUpdateProfileBody = z.infer<typeof UpdateProfileBodyModel>;

export class UpdateProfileAuthDto extends createZodDto(UpdateProfileBodyModel) {
  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    required: false,
    minLength: 1,
  })
  firstName?: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
    required: false,
    minLength: 1,
  })
  lastName?: string;
}
