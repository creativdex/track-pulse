import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const WorkloadItemSchema = z.object({
  key: z.string(),
  display: z.string(),
});

export const WorkloadTaskSchema = z.object({
  key: z.string(),
  createdAt: z.string(),
  summary: z.string(),
  description: z.string().optional(),
  type: z.string(),
  worklogs: z.array(z.string()),
  hoursSpent: z.number(),
  parent: WorkloadItemSchema.optional(),
  project: WorkloadItemSchema.optional(),
  sprint: WorkloadItemSchema.optional(),
});

export const WorkloadSchema = z.object({
  items: z.array(WorkloadItemSchema),
  projects: z.array(WorkloadItemSchema),
  sprints: z.array(WorkloadItemSchema),
});

export const WorkloadQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export type IWorkloadItem = z.infer<typeof WorkloadItemSchema>;
export type IWorkloadTask = z.infer<typeof WorkloadTaskSchema>;
export type IWorkloadQuery = z.infer<typeof WorkloadQuerySchema>;
export type IWorkload = z.infer<typeof WorkloadSchema>;

export class WorkloadItemDto extends createZodDto(WorkloadItemSchema) {}
export class WorkloadTaskDto extends createZodDto(WorkloadTaskSchema) {}
export class WorkloadDto extends createZodDto(WorkloadSchema) {}

export class WorkloadQueryDto extends createZodDto(WorkloadQuerySchema) {
  @ApiProperty({ type: Date, required: false })
  from?: string;

  @ApiProperty({ type: Date, required: false })
  to?: string;
}
