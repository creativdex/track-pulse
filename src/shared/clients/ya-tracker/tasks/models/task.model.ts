import { z } from 'zod';

// Schemas //

export const TrackerUserSchema = z.object({
  self: z.string(),
  id: z.string(),
  display: z.string(),
  passportUid: z.number().optional(),
  cloudUid: z.string().optional(),
});

export const TrackerProjectSchema = z.object({
  self: z.string(),
  id: z.string(),
  display: z.string(),
});

export const TrackerQueueSchema = z.object({
  self: z.string(),
  id: z.string(),
  key: z.string(),
  display: z.string(),
});

export const TrackerStatusSchema = z.object({
  self: z.string(),
  id: z.string(),
  key: z.string(),
  display: z.string(),
});

export const TrackerTypeSchema = z.object({
  self: z.string(),
  id: z.string(),
  key: z.string(),
  display: z.string(),
});

export const TrackerPrioritySchema = z.object({
  self: z.string(),
  id: z.string(),
  key: z.string(),
  display: z.string(),
});

export const TrackerSprintSchema = z.object({
  self: z.string(),
  id: z.string(),
  display: z.string(),
});

export const TrackerParentSchema = z.object({
  self: z.string(),
  id: z.string(),
  key: z.string(),
  display: z.string(),
});

export const TrackerProjectInfoSchema = z.object({
  primary: TrackerProjectSchema,
  secondary: z.array(TrackerProjectSchema),
});

export const TrackerTaskSchema = z.object({
  self: z.string(),
  id: z.string(),
  key: z.string(),
  version: z.number(),
  lastCommentUpdatedAt: z.string(),
  summary: z.string(),
  parent: TrackerParentSchema.optional(),
  aliases: z.array(z.string()).optional(),
  updatedBy: TrackerUserSchema,
  description: z.string(),
  sprint: z.array(TrackerSprintSchema).optional(),
  type: TrackerTypeSchema,
  priority: TrackerPrioritySchema,
  createdAt: z.string(),
  deadline: z.string().optional(),
  resolvedAt: z.string().optional(),
  followers: z.array(TrackerUserSchema),
  createdBy: TrackerUserSchema,
  votes: z.number(),
  assignee: TrackerUserSchema,
  project: TrackerProjectInfoSchema,
  queue: TrackerQueueSchema,
  updatedAt: z.string(),
  status: TrackerStatusSchema,
  previousStatus: TrackerStatusSchema.optional(),
  favorite: z.boolean(),
  tags: z.array(z.string()).optional(),
});

// Types //

export type ITrackerUser = z.infer<typeof TrackerUserSchema>;
export type ITrackerProject = z.infer<typeof TrackerProjectSchema>;
export type ITrackerQueue = z.infer<typeof TrackerQueueSchema>;
export type ITrackerStatus = z.infer<typeof TrackerStatusSchema>;
export type ITrackerType = z.infer<typeof TrackerTypeSchema>;
export type ITrackerPriority = z.infer<typeof TrackerPrioritySchema>;
export type ITrackerSprint = z.infer<typeof TrackerSprintSchema>;
export type ITrackerParent = z.infer<typeof TrackerParentSchema>;
export type ITrackerProjectInfo = z.infer<typeof TrackerProjectInfoSchema>;
export type ITrackerTask = z.infer<typeof TrackerTaskSchema>;
