import { z } from 'zod';

export const GetUserSchema = z.object({ userId: z.string().describe('Ключ пользователя') });

export type IGetUser = z.infer<typeof GetUserSchema>;
