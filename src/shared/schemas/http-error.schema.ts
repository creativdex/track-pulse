import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const HttpErrorZ = z.object({
  statusCode: z.number().int(),
  message: z.string(),
  error: z.unknown().or(z.string()),
});

export class HttpErrorDto extends createZodDto(HttpErrorZ) {
  @ApiProperty({
    description: 'Status code',
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
  })
  message: string;

  @ApiProperty({
    description: 'Error name',
  })
  error: unknown;
}
