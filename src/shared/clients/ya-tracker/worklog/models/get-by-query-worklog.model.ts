import { z } from 'zod';

export const TrackerGetByQueryAtWorklogSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const TrackerGetByQueryWorklogSchema = z.object({
  createdBy: z.string().optional(),
  createdAt: TrackerGetByQueryAtWorklogSchema.optional(),
});

export type ITrackerGetByQueryWorklog = z.infer<typeof TrackerGetByQueryWorklogSchema>;
export type ITrackerGetByQueryAtWorklog = z.infer<typeof TrackerGetByQueryAtWorklogSchema>;
