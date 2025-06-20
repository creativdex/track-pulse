import { Injectable, Logger } from '@nestjs/common';
import { YaTrackerClient } from '@src/shared/clients/ya-tracker/ya-tracker.client';
import {
  IWorkload,
  IWorkloadItem,
  IWorkloadQuery,
  IWorkloadTask,
  IWorklogItem,
} from './models/workload-aggregation.model';
import { IServiceResult } from '@src/shared/types/service-result.type';
import { ConfigService } from '@nestjs/config';
import { UserTrackerService } from '../tracker/user/user.service';

@Injectable()
export class AggregationService {
  protected readonly logger = new Logger(AggregationService.name);
  protected readonly defaultQueue: string;

  constructor(
    protected readonly yaTrackerClient: YaTrackerClient,
    protected readonly configService: ConfigService,
    protected readonly userTrackerService: UserTrackerService,
  ) {
    this.defaultQueue = configService.get<string>('ENV__YA_TRACKER_QUEUE') || 'Prisma';
  }

  async workload(params: IWorkloadQuery): Promise<IServiceResult<IWorkload>> {
    const queue = params.queue || this.defaultQueue;
    const { fromIso, toIso, fromShort, toShort } = this.getPeriodDates(params);

    this.logger.debug(`Fetching users tracker`);
    const allUserTracker = await this.userTrackerService.findAll();
    if (!allUserTracker.success) {
      this.logger.error(`Failed to fetch user trackers: ${allUserTracker.error}`);
      return { success: false, error: allUserTracker.error };
    }
    this.logger.debug(`Found ${allUserTracker.data.length} users tracker`);

    this.logger.debug(`Fetching tasks from ${fromIso} to ${toIso}`);
    const allTasks = await this.yaTrackerClient.tasks.searchTasksToArray({
      query: `Created: ${fromShort} .. ${toShort} Queue: ${queue} "Sort by": Created ASC`,
    });
    if (!allTasks.success || allTasks.data.length === 0) {
      this.logger.warn(`No tasks found for the period ${fromIso} to ${toIso}`);
      return { success: false, error: 'No tasks found' };
    }
    this.logger.debug(`Found ${allTasks.data.length} tasks for the period ${fromIso} to ${toIso}`);

    this.logger.debug(`Fetching worklogs from ${fromIso} to ${toIso}`);
    const allWorklogs = await this.yaTrackerClient.worklog.getByQueryWorklog({
      createdAt: { from: fromIso, to: toIso },
    });
    if (!allWorklogs.success) {
      this.logger.error(`Failed to fetch worklogs: ${allWorklogs.error.message}`);
      return { success: false, error: allWorklogs.error.message };
    }
    this.logger.debug(`Found ${allWorklogs.data.length} worklogs for the period ${fromIso} to ${toIso}`);

    const rateByTrackerUid = new Map<string, number>();
    for (const user of allUserTracker.data) {
      for (const id of user.trackerUid) {
        rateByTrackerUid.set(id, user.rate || 0);
      }
    }

    const worklogByTask = new Map<string, IWorklogItem[]>();

    for (const wl of allWorklogs.data) {
      const taskKey = wl.issue.key;
      if (!worklogByTask.has(taskKey)) {
        worklogByTask.set(taskKey, []);
      }

      worklogByTask.get(taskKey)?.push({
        key: wl.id,
        issueKey: wl.issue.key,
        authorId: wl.createdBy.id,
        comment: wl.comment,
        createdAt: wl.createdAt,
        hoursSpent: this.parseDurationToHours(wl.duration) || 0,
        amount: this.parseDurationToHours(wl.duration) * (rateByTrackerUid.get(wl.createdBy.id) || 0),
      });
    }

    const projects = new Map<string, IWorkloadItem>();
    const sprints = new Map<string, IWorkloadItem>();
    const types = new Map<string, IWorkloadItem>();
    const assignees = new Map<string, IWorkloadItem>();
    const statuses = new Map<string, IWorkloadItem>();
    const tasks: IWorkloadTask[] = [];

    for (const task of allTasks.data) {
      const project = { key: task.project.primary.id, display: task.project.primary.display };
      const sprintArr = task.sprint?.map((s) => ({ key: s.id, display: s.display })) || [];
      const type = { key: task.type.id, display: task.type.display };
      const assignee = task.assignee ? { key: task.assignee.id, display: task.assignee.display } : undefined;
      const worklogs = worklogByTask.get(task.key) || [];
      const totalHoursSpent = worklogs.reduce((sum, wl) => sum + (wl.hoursSpent || 0), 0);
      const totalAmount = worklogs.reduce((sum, wl) => sum + (wl.amount || 0), 0);

      projects.set(project.key, project);
      sprintArr.forEach((s) => sprints.set(s.key, s));
      types.set(type.key, type);
      if (assignee) assignees.set(assignee.key, assignee);
      statuses.set(task.status.key, { key: task.status.key, display: task.status.display });

      tasks.push({
        key: task.key,
        createdAt: task.createdAt,
        summary: task.summary,
        description: task.description,
        worklogs,
        hoursSpent: totalHoursSpent,
        amount: totalAmount,
        statusKey: task.status.key,
        typeKey: task.type.key,
        assigneeId: task.assignee?.id || null,
        projectId: task.project.primary.id || null,
        sprintKey: sprintArr.length ? sprintArr[sprintArr.length - 1].key : null,
        parentKey: task.parent?.key || null,
      });
    }

    this.logger.debug(`Found ${allTasks.data.length} tasks for the period ${fromIso} to ${toIso}`);
    return {
      success: true,
      data: {
        projects: Array.from(projects.values()),
        sprints: Array.from(sprints.values()),
        types: Array.from(types.values()),
        assignees: Array.from(assignees.values()),
        statuses: Array.from(statuses.values()),
        tasks,
      },
    };
  }

  private parseDurationToHours(duration: string): number {
    // Поддержка: 1W, 1w, 1Н, 1н, 1D, 1d, 1Д, 1д, 1H, 1h, 1Ч, 1ч, 1M, 1m, 1М, 1м, 1S, 1s, 1С, 1с
    const regex = /(\d+)\s*([WwНнDdДдHhЧчMmМмSsСс])/g;
    let totalHours = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(duration)) !== null) {
      const value = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();

      switch (unit) {
        case 'w':
        case 'н':
          totalHours += value * 5 * 8; // 1 неделя = 5 дней, 1 день = 8 часов
          break;
        case 'd':
        case 'д':
          totalHours += value * 8;
          break;
        case 'h':
        case 'ч':
          totalHours += value;
          break;
        case 'm':
        case 'м':
          totalHours += value / 60;
          break;
        case 's':
        case 'с':
          totalHours += value / 3600;
          break;
      }
    }

    return totalHours;
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
