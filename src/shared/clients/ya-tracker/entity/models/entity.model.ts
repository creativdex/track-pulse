import { z } from 'zod';
import { ETrackerProjectPortfolioStatus, ETrackerGoalStatus, ETrackerEntityType } from '../entity.enum';

const TrackerCreatedBySchema = z.object({
  id: z.string(),
  self: z.string().optional(),
  display: z.string().optional(),
  passportUid: z.number().optional(),
  cloudUid: z.string().optional(),
});

const TrackerAttachmentSchema = z.object({
  id: z.string(),
  self: z.string().optional(),
  name: z.string().optional(),
  content: z.string().optional(),
  createdBy: TrackerCreatedBySchema.optional(),
  createdAt: z.string().optional(),
  mimetype: z.string().optional(),
  size: z.number().optional(),
});

const TrackerUserSchema = z.object({
  id: z.string(),
  self: z.string().optional(),
  display: z.string().optional(),
  passportUid: z.number().optional(),
  cloudUid: z.string().optional(),
});

const TrackerChecklistItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  textHtml: z.string().optional(),
  checked: z.boolean(),
  assignee: TrackerUserSchema.optional(),
  deadline: z.string().optional(),
  checklistItemType: z.string().optional(),
});

const TrackerParentEntitySchema = z.object({
  primary: z
    .object({
      id: z.string(),
      self: z.string().optional(),
      display: z.string().optional(),
    })
    .optional(),
  secondary: z
    .array(
      z.object({
        id: z.string(),
        self: z.string().optional(),
        display: z.string().optional(),
      }),
    )
    .optional(),
});

const TrackerIssueQueueSchema = z.object({
  id: z.string(),
  self: z.string().optional(),
  key: z.string().optional(),
  display: z.string().optional(),
});

const TrackerFieldsSchema = z.object({
  summary: z.string().optional(),
  description: z.string().optional(),
  author: TrackerUserSchema.optional(),
  lead: TrackerUserSchema.optional(),
  teamUsers: z.array(TrackerUserSchema).optional(),
  clients: z.array(TrackerUserSchema).optional(),
  followers: z.array(TrackerUserSchema).optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  checklistItems: z.array(TrackerChecklistItemSchema).optional(),
  tags: z.array(z.string()).optional(),
  parentEntity: TrackerParentEntitySchema.optional(),
  teamAccess: z.string().optional(),
  quarter: z.array(z.string()).optional(),
  entityStatus: z.union([z.nativeEnum(ETrackerProjectPortfolioStatus), z.nativeEnum(ETrackerGoalStatus)]).optional(),
  issueQueues: z.array(TrackerIssueQueueSchema).optional(),
});

export const TrackerEntitySchema = z.object({
  id: z.string(),
  self: z.string().optional(),
  version: z.number().optional(),
  shortId: z.string().optional(),
  entityType: z.nativeEnum(ETrackerEntityType).optional(),
  createdBy: TrackerCreatedBySchema.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  attachments: z.array(TrackerAttachmentSchema).optional(),
  fields: TrackerFieldsSchema.optional(),
});

export type ITrackerEntity = z.infer<typeof TrackerEntitySchema>;
