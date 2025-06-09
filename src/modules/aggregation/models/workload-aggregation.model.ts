import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export type IWorkloadTask = {
  key: string;
  createdAt: string;
  summary: string;
  description?: string;
  type: string;
  project: string;
  worklogs: string[];
  hoursSpent: number;
  children: IWorkloadTask[];
};

export const WorkloadTaskSchema: z.ZodType<IWorkloadTask> = z.lazy(() =>
  z.object({
    key: z.string(),
    createdAt: z.string(),
    summary: z.string(),
    description: z.string().optional(),
    type: z.string(),
    project: z.string(),
    worklogs: z.array(z.string()),
    hoursSpent: z.number(),
    children: z.array(WorkloadTaskSchema),
  }),
);

export type IWorkloadTaskWithParent = IWorkloadTask & {
  parent?: { key: string };
};

export const WorkloadTaskWithParentSchema: z.ZodType<IWorkloadTaskWithParent> = z.lazy(() =>
  z.object({
    key: z.string(),
    createdAt: z.string(),
    summary: z.string(),
    description: z.string().optional(),
    type: z.string(),
    project: z.string(),
    worklogs: z.array(z.string()),
    hoursSpent: z.number(),
    children: z.array(WorkloadTaskWithParentSchema),
    parent: z
      .object({
        key: z.string(),
      })
      .optional(),
  }),
);

export class WorkloadTaskDto extends createZodDto(WorkloadTaskSchema) {}

export const WorkloadQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export type IWorkloadQuery = z.infer<typeof WorkloadQuerySchema>;

export class WorkloadQueryDto extends createZodDto(WorkloadQuerySchema) {
  @ApiProperty({ type: Date, required: false })
  from?: string;

  @ApiProperty({ type: Date, required: false })
  to?: string;
}

export class WorkloadTaskWithParentDto extends createZodDto(WorkloadTaskWithParentSchema) {}

export const WorkloadProjectSummarySchema = z.object({
  summary: z.string(),
  hoursSpent: z.number(),
  tasks: z.array(WorkloadTaskWithParentSchema),
});
export class WorkloadProjectSummaryDto extends createZodDto(WorkloadProjectSummarySchema) {}

export type IProjectSummary = z.infer<typeof WorkloadProjectSummarySchema>;

export const WorkloadProjectsSummarySchema = z.record(WorkloadProjectSummarySchema);

export type IWorkloadProjectsSummary = z.infer<typeof WorkloadProjectsSummarySchema>;

export class WorkloadProjectsSummaryDto extends createZodDto(WorkloadProjectsSummarySchema) {}
