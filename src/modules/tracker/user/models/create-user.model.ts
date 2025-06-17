import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateUserTrackerSchema = z.object({
  trackerUid: z.string(),

  display: z.string().min(2).max(100),

  email: z.string().email(),

  login: z.string().min(2).max(100),

  roles: z.array(z.string()),

  dismissed: z.boolean(),
});

export type ICreateUserTracker = z.infer<typeof CreateUserTrackerSchema>;

export class CreateUserTrackerDto extends createZodDto(CreateUserTrackerSchema) {}
