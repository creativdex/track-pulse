import { z } from 'zod';

export const GetQueuesQuerySchema = z.object({
  expand: z.string().optional(), // projects, components, versions, types, team, workflows
  perPage: z.number().min(1).max(100).optional(),
  page: z.number().min(1).optional(),
});

export const GetQueuesOptionsSchema = z.object({
  perPage: z.number().min(1).max(100).optional(),
  strategy: z.enum(['scroll', 'paginate']).optional(),
});

export type IGetQueuesQuery = z.infer<typeof GetQueuesQuerySchema>;
export type IGetQueuesOptions = z.infer<typeof GetQueuesOptionsSchema>;
