import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const SyncUserResultSchema = z.object({
  created: z.number(),
  updated: z.number(),
  failed: z.number(),
});

export type ISyncUserResult = z.infer<typeof SyncUserResultSchema>;

export class SyncUserResultDto extends createZodDto(SyncUserResultSchema) {
  @ApiProperty({
    description: 'Number of users created during the sync process',
    example: 5,
  })
  created: number;

  @ApiProperty({
    description: 'Number of users updated during the sync process',
    example: 3,
  })
  updated: number;

  @ApiProperty({
    description: 'Number of users failed during the sync process',
    example: 1,
  })
  failed: number;
}
