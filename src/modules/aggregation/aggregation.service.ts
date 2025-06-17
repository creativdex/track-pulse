import { Injectable, Logger } from '@nestjs/common';
import { YaTrackerClient } from '@src/shared/clients/ya-tracker/ya-tracker.client';
import { IWorkload, IWorkloadQuery } from './models/workload-aggregation.model';
import { IServiceResult } from '@src/shared/types/service-result.type';

@Injectable()
export class AggregationService {
  protected readonly logger = new Logger(AggregationService.name);

  constructor(protected readonly yaTrackerClient: YaTrackerClient) {}

  async workload(params: IWorkloadQuery): Promise<IServiceResult<IWorkload>> {
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

    // const worklogs = await this.yaTrackerClient.worklog.getByQueryWorklog({
    //   createdAt: { from: fromIso, to: toIso },
    // });

    // 1. Получаем проекты из задач
    // const projects = new Map<>();

    return {
      success: true,
      data: {
        items: [],
        projects: [],
        sprints: [],
      },
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
