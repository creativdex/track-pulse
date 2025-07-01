import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { EUserTrackerRateType } from './user-rate.model';

export const CreateUserTrackerRateSchema = z.object({
  rate: z.number().describe("The employee's rate is RUB per hour"),
  userId: z.string().uuid().describe('Unique identifier of the user who gave the rate'),
  type: z.nativeEnum(EUserTrackerRateType).describe('Type of the rate, e.g., project, queue, or global'),
  contextValue: z.string().optional().describe('Optional context value associated with the rate'),
  comment: z.string().optional().describe('Optional comment about the rate'),
});

export type ICreateUserTrackerRate = z.infer<typeof CreateUserTrackerRateSchema>;

export class CreateUserTrackerRateDto extends createZodDto(CreateUserTrackerRateSchema) {}
