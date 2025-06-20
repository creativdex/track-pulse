import { z } from 'zod';

export const TrackerWorklogIssueSchema = z.object({
  self: z.string(),
  id: z.string(),
  key: z.string(),
  display: z.string(),
});

export type ITrackerWorklogIssue = z.infer<typeof TrackerWorklogIssueSchema>;

export const TrackerWorklogUserSchema = z.object({
  self: z.string(),
  id: z.string(),
  display: z.string(),
});

export type ITrackerWorklogUser = z.infer<typeof TrackerWorklogUserSchema>;

export const TrackerWorklogSchema = z.object({
  self: z.string(),
  id: z.number(),
  version: z.string(),
  issue: TrackerWorklogIssueSchema,
  comment: z.string(),
  createdBy: TrackerWorklogUserSchema,
  updatedBy: TrackerWorklogUserSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  start: z.string(),
  duration: z.string(),
});

export type ITrackerWorklog = z.infer<typeof TrackerWorklogSchema>;
