import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UserRateSchema = z.object({
  id: z.string().uuid().describe('Unique identifier for the user rate'),
  createdAt: z.date().describe('Timestamp when the user rate was created'),
  updatedAt: z.date().describe('Timestamp when the user rate was last updated'),
  rate: z.number().describe('Rating value given by the user'),
  userId: z.string().uuid().describe('Unique identifier of the user who gave the rate'),
});

export type IUserRate = z.infer<typeof UserRateSchema>;

export class UserRateDto extends createZodDto(UserRateSchema) {}
