import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export enum EUserTrackerRateType {
  PROJECT = 'project',
  QUEUE = 'queue',
  GLOBAL = 'global',
}

export const UserTrackerRateSchema = z.object({
  id: z.string().uuid().describe('Unique identifier for the user rate'),
  createdAt: z.date().describe('Timestamp when the user rate was created'),
  updatedAt: z.date().describe('Timestamp when the user rate was last updated'),
  rate: z.number().describe('Rating value given by the user'),
  userId: z.string().uuid().describe('Unique identifier of the user who gave the rate'),
  type: z.nativeEnum(EUserTrackerRateType).describe('Type of the rate, e.g., project, queue, or global'),
  contextValue: z.string().optional().describe('Optional context value associated with the rate'),
  isActive: z.boolean().default(true).describe('Indicates if the rate is currently active'),
});

export type IUserTrackerRate = z.infer<typeof UserTrackerRateSchema>;

export class UserTrackerRateDto extends createZodDto(UserTrackerRateSchema) {}
