import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateUserRateSchema = z.object({
  rate: z.number().describe('Rating value given by the user'),
  userId: z.string().uuid().describe('Unique identifier of the user who gave the rate'),
});

export type ICreateUserRate = z.infer<typeof CreateUserRateSchema>;

export class CreateUserRateDto extends createZodDto(CreateUserRateSchema) {}
