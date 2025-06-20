import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RateChangeSchema = z.object({
  employeeId: z.string().uuid().describe('Unique identifier of the employee'),
  newRate: z.number().min(0).describe('New rate in RUB per hour'),
  comment: z.string().optional().describe('Optional comment about the rate change'),
});

export type IRateChange = z.infer<typeof RateChangeSchema>;

export class RateChangeDto extends createZodDto(RateChangeSchema) {}
