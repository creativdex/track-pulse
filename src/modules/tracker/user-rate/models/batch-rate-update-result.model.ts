import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const BatchRateUpdateResultSchema = z.object({
  employeeId: z.string().uuid().describe('Unique identifier of the employee'),
  success: z.boolean().describe('Whether the rate update was successful'),
  error: z.string().optional().describe('Error message if the update failed'),
  rateId: z.string().uuid().optional().describe('ID of the created rate record if successful'),
});

export type IBatchRateUpdateResult = z.infer<typeof BatchRateUpdateResultSchema>;

export class BatchRateUpdateResultDto extends createZodDto(BatchRateUpdateResultSchema) {}
