import { z } from 'zod';

const TrackerUserSchema = z.object({
  self: z.string().optional(),
  id: z.string(),
  display: z.string().optional(),
  passportUid: z.number().optional(),
  cloudUid: z.string().optional(),
});

const TrackerIssueTypeSchema = z.object({
  self: z.string().optional(),
  id: z.string(),
  key: z.string().optional(),
  display: z.string().optional(),
});

const TrackerPrioritySchema = z.object({
  self: z.string().optional(),
  id: z.string(),
  key: z.string().optional(),
  display: z.string().optional(),
});

const TrackerVersionSchema = z.object({
  self: z.string().optional(),
  id: z.string(),
  display: z.string().optional(),
});

const TrackerWorkflowSchema = z.object({
  self: z.string().optional(),
  id: z.string(),
  display: z.string().optional(),
});

const TrackerResolutionSchema = z.object({
  self: z.string().optional(),
  id: z.string(),
  key: z.string().optional(),
  display: z.string().optional(),
});

const TrackerIssueTypeConfigSchema = z.object({
  issueType: TrackerIssueTypeSchema.optional(),
  workflow: TrackerWorkflowSchema.optional(),
  resolutions: z.array(TrackerResolutionSchema).optional(),
});

export const TrackerQueueSchema = z.object({
  self: z.string().optional(),
  id: z.number(),
  key: z.string(),
  version: z.number().optional(),
  name: z.string(),
  description: z.string().optional(),
  lead: TrackerUserSchema.optional(),
  assignAuto: z.boolean().optional(),
  defaultType: TrackerIssueTypeSchema.optional(),
  defaultPriority: TrackerPrioritySchema.optional(),
  teamUsers: z.array(TrackerUserSchema).optional(),
  issueTypes: z.array(TrackerIssueTypeSchema).optional(),
  versions: z.array(TrackerVersionSchema).optional(),
  workflows: z.record(z.array(TrackerIssueTypeSchema)).optional(),
  denyVoting: z.boolean().optional(),
  issueTypesConfig: z.array(TrackerIssueTypeConfigSchema).optional(),
});

export type ITrackerQueue = z.infer<typeof TrackerQueueSchema>;
