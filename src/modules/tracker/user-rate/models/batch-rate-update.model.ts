import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { RateChangeSchema } from './rate-change.model';

export const BatchRateUpdateSchema = z.object({
  changes: z.array(RateChangeSchema).describe('Array of rate changes to process'),
});

export type IBatchRateUpdate = z.infer<typeof BatchRateUpdateSchema>;

export class BatchRateUpdateDto extends createZodDto(BatchRateUpdateSchema) {}
