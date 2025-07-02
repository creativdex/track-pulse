import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const TrackerQueueSchema = z.object({
  id: z.number(),
  key: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
});

export const TrackerProjectSchema = z.object({
  id: z.number(),
  key: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
});

export type ITrackerQueue = z.infer<typeof TrackerQueueSchema>;
export type ITrackerProject = z.infer<typeof TrackerProjectSchema>;

export class TrackerQueueDto extends createZodDto(TrackerQueueSchema) {}
export class TrackerProjectDto extends createZodDto(TrackerProjectSchema) {}
