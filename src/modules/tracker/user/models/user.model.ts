import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UserTrackerSchema = z.object({
  id: z.string().uuid(),

  createdAt: z.date(),

  updatedAt: z.date(),

  trackerUid: z.array(z.string()),

  display: z.string().min(2).max(100),

  email: z.string().email(),

  login: z.string().min(2).max(100),

  roles: z.array(z.string()),

  dismissed: z.boolean(),

  rate: z.number().nullable(),
});

export type IUserTracker = z.infer<typeof UserTrackerSchema>;

export class UserTrackerDto extends createZodDto(UserTrackerSchema) {}
