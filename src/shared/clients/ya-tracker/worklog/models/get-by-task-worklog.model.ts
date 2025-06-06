import { z } from 'zod';

export const TrackerGetByTaskWorklogSchema = z.object({
  taskId: z.string(),
});

export type ITrackerGetByTaskWorklog = z.infer<typeof TrackerGetByTaskWorklogSchema>;
