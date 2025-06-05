import { z } from 'zod';

// Schemas //

export const QueueFieldSchema = z.object({
  id: z.string().optional(),
  key: z.string().optional(),
});

export const ParentFieldSchema = z.object({
  id: z.string().optional(),
  key: z.string().optional(),
});

export const TypeFieldSchema = z.object({
  id: z.string().optional(),
  key: z.string().optional(),
});

export const PriorityFieldSchema = z.object({
  id: z.string().optional(),
  key: z.string().optional(),
});

export const FollowerFieldSchema = z.object({
  id: z.string(),
});

export const AssigneeFieldSchema = z.object({
  id: z.string(),
});

export const AuthorFieldSchema = z.object({
  id: z.string(),
});

export const ProjectFieldSchema = z.object({
  primary: z.number(),
  secondary: z.array(z.number()).optional(),
});

export const CreateTaskSchema = z.object({
  // Обязательные параметры
  summary: z.string(),
  queue: z.union([QueueFieldSchema, z.string(), z.number()]),

  parent: z.union([ParentFieldSchema, z.string()]).optional(),
  description: z.string().optional(),
  markupType: z.string().optional(),
  sprint: z.union([z.array(z.object({})), z.array(z.string())]).optional(),
  type: z.union([TypeFieldSchema, z.string(), z.number()]).optional(),
  priority: z.union([PriorityFieldSchema, z.string(), z.number()]).optional(),
  followers: z.array(z.union([FollowerFieldSchema, z.string(), z.number()])).optional(),
  assignee: z.union([AssigneeFieldSchema, z.string(), z.number()]).optional(),
  author: z.union([AuthorFieldSchema, z.string(), z.number()]).optional(),
  project: ProjectFieldSchema.optional(),
  unique: z.string().optional(),
  attachmentIds: z.array(z.string()).optional(),
  descriptionAttachmentIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

// Types //

export type IQueueField = z.infer<typeof QueueFieldSchema>;
export type IParentField = z.infer<typeof ParentFieldSchema>;
export type ITypeField = z.infer<typeof TypeFieldSchema>;
export type IPriorityField = z.infer<typeof PriorityFieldSchema>;
export type IFollowerField = z.infer<typeof FollowerFieldSchema>;
export type IAssigneeField = z.infer<typeof AssigneeFieldSchema>;
export type IAuthorField = z.infer<typeof AuthorFieldSchema>;
export type IProjectField = z.infer<typeof ProjectFieldSchema>;
export type ICreateTask = z.infer<typeof CreateTaskSchema>;
