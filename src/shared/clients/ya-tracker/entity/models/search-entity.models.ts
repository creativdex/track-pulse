import { z } from 'zod';
import { ETrackerEntityType } from '../entity.enum';
import { TrackerEntitySchema } from './entity.model';

export const TrackerSearchEntityPathSchema = z.object({
  typeEntity: z.nativeEnum(ETrackerEntityType),
});

export const TrackerSearchEntityBodySchema = z.object({
  input: z.string().optional(),
  filter: z.unknown().optional(),
  orderBy: z.string().optional(),
  orderAsc: z.boolean().optional(),
  rootOnly: z.boolean().optional(),
});

export const TrackerSearchEntityQuerySchema = z.object({
  fields: z.string().optional(),
  perPage: z.string().optional(),
  page: z.string().optional(),
});

export const TrackerSearchEntitySchema = z.object({
  path: TrackerSearchEntityPathSchema,
  body: TrackerSearchEntityBodySchema.optional(),
  query: TrackerSearchEntityQuerySchema.optional(),
});

export const TrackerSearchEntityResultSchema = z.object({
  hits: z.number(),
  pages: z.number(),
  orderBy: z.string().optional(),
  values: z.array(TrackerEntitySchema),
});

export type ITrackerSearchEntity = z.infer<typeof TrackerSearchEntitySchema>;
export type ITrackerSearchEntityBody = z.infer<typeof TrackerSearchEntityBodySchema>;
export type ITrackerSearchEntityResult = z.infer<typeof TrackerSearchEntityResultSchema>;
