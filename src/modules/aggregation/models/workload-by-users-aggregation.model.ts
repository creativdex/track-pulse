import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const WorkloadByUsersItemSchema = z.object({
  userId: z.string(),
  display: z.string(),
  hoursSpent: z.number(),
});

export type IWorkloadByUsersItem = z.infer<typeof WorkloadByUsersItemSchema>;

export class WorkloadByUsersAggregationDto extends createZodDto(WorkloadByUsersItemSchema) {}
