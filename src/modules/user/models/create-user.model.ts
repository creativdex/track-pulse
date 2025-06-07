import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateUserSchema = z.object({
  trackerUid: z.string(),

  display: z.string().min(2).max(100),

  email: z.string().email(),

  login: z.string().min(2).max(100),

  roles: z.array(z.string()),

  dismissed: z.boolean(),
});

export type ICreateUser = z.infer<typeof CreateUserSchema>;

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
