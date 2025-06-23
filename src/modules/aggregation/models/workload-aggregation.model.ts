import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const WorkloadItemSchema = z.object({
  key: z.string(),
  display: z.string(),
});

export const WorklogItemSchema = z.object({
  key: z.number(),
  issueKey: z.string(),
  authorId: z.string(),
  comment: z.string().optional(),
  createdAt: z.string(),
  hoursSpent: z.number().nullable(),
  amount: z.number().nullable(),
});

export const WorkloadTaskSchema = z.object({
  key: z.string(),
  createdAt: z.string(),
  deadline: z.string().nullable(),
  resolvedAt: z.string().nullable(),
  deltaTime: z.number().nullable(),
  summary: z.string(),
  description: z.string().optional(),
  worklogs: z.array(WorklogItemSchema).optional(),
  hoursSpent: z.number().nullable(),
  amount: z.number().nullable(),
  statusKey: z.string(),
  typeKey: z.string(),
  assigneeId: z.string().nullable(),
  projectId: z.string().nullable(),
  sprintKey: z.string().nullable(),
  parentKey: z.string().nullable(),
});

export const WorkloadSchema = z.object({
  projects: z.array(WorkloadItemSchema),
  sprints: z.array(WorkloadItemSchema),
  types: z.array(WorkloadItemSchema),
  assignees: z.array(WorkloadItemSchema),
  statuses: z.array(WorkloadItemSchema),
  tasks: z.array(WorkloadTaskSchema),
});

export const WorkloadQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  queue: z.string().optional().default('Prisma').describe('Queue to filter tasks'),
});

export type IWorkloadItem = z.infer<typeof WorkloadItemSchema>;
export type IWorkloadTask = z.infer<typeof WorkloadTaskSchema>;
export type IWorkloadQuery = z.infer<typeof WorkloadQuerySchema>;
export type IWorkload = z.infer<typeof WorkloadSchema>;
export type IWorklogItem = z.infer<typeof WorklogItemSchema>;

export class WorkloadItemDto extends createZodDto(WorkloadItemSchema) {}
export class WorkloadTaskDto extends createZodDto(WorkloadTaskSchema) {}
export class WorkloadDto extends createZodDto(WorkloadSchema) {}
export class WorklogItemDto extends createZodDto(WorklogItemSchema) {}

export class WorkloadQueryDto extends createZodDto(WorkloadQuerySchema) {
  @ApiProperty({ type: Date, required: false })
  from?: string;

  @ApiProperty({ type: Date, required: false })
  to?: string;
}
