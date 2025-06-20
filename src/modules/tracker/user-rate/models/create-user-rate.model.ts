import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateUserTrackerRateSchema = z.object({
  rate: z.number().describe("The employee's rate is RUB per hour"),
  userId: z.string().uuid().describe('Unique identifier of the user who gave the rate'),
  comment: z.string().optional().describe('Optional comment about the rate'),
});

export type ICreateUserTrackerRate = z.infer<typeof CreateUserTrackerRateSchema>;

export class CreateUserTrackerRateDto extends createZodDto(CreateUserTrackerRateSchema) {}
