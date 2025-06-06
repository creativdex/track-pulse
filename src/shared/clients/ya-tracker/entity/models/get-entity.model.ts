import { z } from 'zod';
import { ETrackerEntityType } from '../entity.enum';

export const TrackerGetEntityPathSchema = z.object({
  typeEntity: z.nativeEnum(ETrackerEntityType),
  id: z.string(),
});

export const TrackerGetEntityQuerySchema = z.object({
  fields: z.string().optional(),
  expand: z.string().optional(),
});

export const TrackerGetEntitySchema = z.object({
  path: TrackerGetEntityPathSchema,
  query: TrackerGetEntityQuerySchema.optional(),
});

export type ITrackerGetEntity = z.infer<typeof TrackerGetEntitySchema>;
export type ITrackerGetEntityQuery = z.infer<typeof TrackerGetEntityQuerySchema>;
export type ITrackerGetEntityPath = z.infer<typeof TrackerGetEntityPathSchema>;
