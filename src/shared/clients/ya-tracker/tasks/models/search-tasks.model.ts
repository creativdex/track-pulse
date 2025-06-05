import { z } from 'zod';

/**
 * Схема фильтра для поиска задач
 */
export const TaskFilterSchema = z.record(z.unknown()).optional();

/**
 * Схема параметров поиска задач
 */
export const SearchTasksRequestSchema = z.object({
  filter: TaskFilterSchema,
  order: z.string().optional(),
  queue: z.string().optional(),
  keys: z.union([z.string(), z.array(z.string())]).optional(),
  query: z.string().optional(),
});

/**
 * Схема параметров expand
 */
export const ExpandParametersSchema = z.object({
  transitions: z.boolean().optional(),
  attachments: z.boolean().optional(),
});

/**
 * Опции для поиска задач
 */
export const SearchTasksOptionsSchema = z.object({
  expand: ExpandParametersSchema.optional(),
  perPage: z.number().min(1).max(10000).optional(),
  strategy: z.enum(['scroll', 'paginate']).optional(),
});

// Типы
export type ITaskFilter = z.infer<typeof TaskFilterSchema>;
export type ISearchTasksRequest = z.infer<typeof SearchTasksRequestSchema>;
export type IExpandParameters = z.infer<typeof ExpandParametersSchema>;
export type ISearchTasksOptions = z.infer<typeof SearchTasksOptionsSchema>;
