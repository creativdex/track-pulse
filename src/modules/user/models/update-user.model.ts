import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateUserSchema = z.object({
  trackerUid: z.array(z.string()).optional(),

  display: z.string().min(2).max(100).optional(),

  email: z.string().email().optional(),

  login: z.string().min(2).max(100).optional(),

  roles: z.array(z.string()).optional(),

  dismissed: z.boolean().optional(),
});

export type IUpdateUser = z.infer<typeof UpdateUserSchema>;

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
