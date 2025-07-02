import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { CreateUserTrackerRateSchema } from './create-user-rate.model';

export const BatchRateUpdateSchema = z.object({
  changes: z.array(CreateUserTrackerRateSchema).describe('Array of rate changes to process'),
});

export type IBatchRateUpdate = z.infer<typeof BatchRateUpdateSchema>;

export class BatchRateUpdateDto extends createZodDto(BatchRateUpdateSchema) {}
