import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateUserTrackerSchema = z.object({
  trackerUid: z.array(z.string()).optional(),

  display: z.string().min(2).max(100).optional(),

  email: z.string().email().optional(),

  login: z.string().min(2).max(100).optional(),

  roles: z.array(z.string()).optional(),

  dismissed: z.boolean().optional(),
});

export type IUpdateUserTracker = z.infer<typeof UpdateUserTrackerSchema>;

export class UpdateUserTrackerDto extends createZodDto(UpdateUserTrackerSchema) {}
