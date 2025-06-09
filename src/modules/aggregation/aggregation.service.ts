import { Injectable, Logger } from '@nestjs/common';
import { YaTrackerClient } from '@src/shared/clients/ya-tracker/ya-tracker.client';
import {
  IProjectSummary,
  IWorkloadQuery,
  IWorkloadTask,
  IWorkloadTaskWithParent,
} from './models/workload-aggregation.model';
import { ITrackerWorklog } from '@src/shared/clients/ya-tracker/worklog/models/worklog.model';
import { IServiceResult } from '@src/shared/types/service-result.type';

@Injectable()
export class AggregationService {
  protected readonly logger = new Logger(AggregationService.name);

  constructor(protected readonly yaTrackerClient: YaTrackerClient) {}

  async workload(params: IWorkloadQuery): Promise<IServiceResult<Record<string, IProjectSummary>>> {
    const { fromIso, toIso, fromShort, toShort } = this.getPeriodDates(params);

    this.logger.debug(`Fetching tasks from ${fromIso} to ${toIso}`);

    const allTasks = await this.yaTrackerClient.tasks.searchTasksToArray({
      query: `Created: ${fromShort} .. ${toShort} "Sort by": Created ASC`,
    });

    if (!allTasks.success || allTasks.data.length === 0) {
      this.logger.warn(`No tasks found for the period ${fromIso} to ${toIso}`);
      return { success: false, error: 'No tasks found' };
    }

    this.logger.debug(`Found ${allTasks.data.length} tasks for the period ${fromIso} to ${toIso}`);

    // 1. Собираем задачи в Map
    const issuesByKey = new Map<string, IWorkloadTaskWithParent>(
      allTasks.data.map((issue) => [
        issue.key,
        {
          key: issue.key,
          createdAt: issue.createdAt,
          summary: issue.summary,
          type: issue.type.display,
          project: issue.project?.primary?.display || 'Unknown Project',
          worklogs: [],
          hoursSpent: 0,
          children: [],
          parent: issue.parent ? { key: issue.parent.key } : undefined,
        },
      ]),
    );

    // 2. Вкладываем задачи друг в друга по parent
    for (const issue of issuesByKey.values()) {
      if (issue.parent?.key && issuesByKey.has(issue.parent.key)) {
        issuesByKey.get(issue.parent.key)!.children.push(issue);
      }
    }

    // 3. Группируем по проекту только верхнеуровневые (без parent или parent не найден)
    const hierarchy: Record<string, IWorkloadTaskWithParent[]> = {};
    for (const issue of issuesByKey.values()) {
      if (!issue.parent?.key || !issuesByKey.has(issue.parent.key)) {
        if (!hierarchy[issue.project]) hierarchy[issue.project] = [];
        hierarchy[issue.project].push(issue);
      }
    }

    // 4. Получаем ворклоги
    const worklogs = await this.yaTrackerClient.worklog.getByQueryWorklog({
      createdAt: { from: fromIso, to: toIso },
    });

    const worklogMap = new Map<string, ITrackerWorklog[]>();
    if (worklogs.success && worklogs.data.length > 0) {
      worklogs.data.forEach((worklog) => {
        const arr = worklogMap.get(worklog.issue.key) ?? [];
        arr.push(worklog);
        worklogMap.set(worklog.issue.key, arr);
      });
    }

    // 5. Рекурсивно считаем часы и строим итоговую структуру
    const result: Record<string, IProjectSummary> = {};
    for (const [project, tasks] of Object.entries(hierarchy)) {
      const tasksWithHours = tasks.map((task) => this.calcTaskHours(task, worklogMap));
      const hoursSpent = tasksWithHours.reduce((sum, task) => sum + task.hoursSpent, 0);
      // Можно взять summary первого таска или сделать свою логику
      const summary = tasksWithHours[0]?.project ?? project;
      result[project] = {
        summary,
        hoursSpent,
        tasks: tasksWithHours,
      };
    }

    return { success: true, data: result };
  }

  // Рекурсивно считает часы и собирает ворклоги для всей иерархии
  private calcTaskHours(task: IWorkloadTaskWithParent, worklogMap: Map<string, ITrackerWorklog[]>): IWorkloadTask {
    const worklogs = worklogMap.get(task.key) ?? [];
    const selfHours = worklogs.reduce((sum, wl) => sum + this.parseISODurationToHours(wl.duration), 0);
    const selfWorklogs = worklogs.map((wl) => wl.comment);

    let children: IWorkloadTask[] = [];
    let childrenHours = 0;

    if (task.children && task.children.length > 0) {
      children = task.children.map((child) => {
        const res = this.calcTaskHours(child, worklogMap);
        childrenHours += res.hoursSpent;
        return res;
      });
    }

    return {
      ...task,
      hoursSpent: selfHours + childrenHours,
      worklogs: selfWorklogs,
      children,
    };
  }

  private parseISODurationToHours(duration: string): number {
    // Пример: P1DT2H30M
    const regex = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/;
    const match = duration.match(regex);
    if (!match) return 0;
    const days = match[1] ? parseInt(match[1], 10) : 0;
    const hours = match[2] ? parseInt(match[2], 10) : 0;
    const minutes = match[3] ? parseInt(match[3], 10) : 0;
    return days * 8 + hours + minutes / 60; // 1 день = 8 часов
  }

  private getPeriodDates(params: IWorkloadQuery): {
    fromIso: string;
    toIso: string;
    fromShort: string;
    toShort: string;
  } {
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const defaultTo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const fromDate = params.from ? new Date(params.from) : defaultFrom;
    const toDate = params.to ? new Date(params.to) : defaultTo;

    const toIsoString = (val: Date) => val.toISOString();
    const toShortDate = (val: Date) => val.toISOString().slice(0, 10);

    return {
      fromIso: toIsoString(fromDate),
      toIso: toIsoString(toDate),
      fromShort: toShortDate(fromDate),
      toShort: toShortDate(toDate),
    };
  }
}
