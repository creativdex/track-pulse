import { z } from 'zod';

export const TrackerGetUserSchema = z.object({ userId: z.string().describe('Ключ пользователя') });

export type ITrackerGetUser = z.infer<typeof TrackerGetUserSchema>;
