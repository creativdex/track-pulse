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
import { UserTrackerRateService } from '../tracker/user-rate/user-rate.service';

@Injectable()
export class AggregationService {
  protected readonly logger = new Logger(AggregationService.name);
  protected readonly defaultQueue: string;

  constructor(
    protected readonly yaTrackerClient: YaTrackerClient,
    protected readonly configService: ConfigService,
    protected readonly userTrackerService: UserTrackerService,
    protected readonly userTrackerRateService: UserTrackerRateService,
  ) {
    this.defaultQueue = configService.get<string>('ENV__YA_TRACKER_QUEUE') || 'Zota';
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
    const allWorklogs = await this.yaTrackerClient.worklog.getByQueryAllWorklog({
      createdAt: { from: fromIso, to: toIso },
    });
    if (!allWorklogs.success) {
      this.logger.error(`Failed to fetch worklogs: ${allWorklogs.error.message}`);
      return { success: false, error: allWorklogs.error.message };
    }
    this.logger.debug(`Found ${allWorklogs.data.length} worklogs for the period ${fromIso} to ${toIso}`);

    // Получаем все активные ставки в виде Map для быстрого поиска
    this.logger.debug(`Fetching active user rates`);
    const ratesMap = await this.userTrackerRateService.findAllActiveRatesAsMap();
    this.logger.debug(`Loaded ${ratesMap.size} rate entries`);

    // Создаём Map для быстрого поиска пользователя по trackerUid
    const trackerUidToUser = new Map<string, string>();
    for (const user of allUserTracker.data) {
      for (const trackerUid of user.trackerUid) {
        trackerUidToUser.set(trackerUid, user.id);
      }
    }

    // Создаём Map задач с информацией о проекте для правильного определения ставок
    const taskInfoMap = new Map<string, { projectId?: string; queueKey: string }>();
    for (const task of allTasks.data) {
      taskInfoMap.set(task.key, {
        projectId: task.project?.primary?.id,
        queueKey: queue, // Все задачи из одной очереди в данном запросе
      });
    }

    const worklogByTask = new Map<string, IWorklogItem[]>();

    for (const wl of allWorklogs.data) {
      const taskKey = wl.issue.key;
      if (!worklogByTask.has(taskKey)) {
        worklogByTask.set(taskKey, []);
      }

      // Определяем ставку пользователя с учётом приоритета (project > queue > global)
      const userId = trackerUidToUser.get(wl.createdBy.id);
      const taskInfo = taskInfoMap.get(taskKey);
      let rate = 0;

      if (userId && taskInfo) {
        rate = UserTrackerRateService.findRateFromMap(ratesMap, userId, taskInfo.projectId, taskInfo.queueKey) || 0;
      }

      const hoursSpent = this.parseDurationToHours(wl.duration) || 0;

      worklogByTask.get(taskKey)?.push({
        key: wl.id,
        issueKey: wl.issue.key,
        authorId: wl.createdBy.id,
        comment: wl.comment,
        createdAt: wl.createdAt,
        hoursSpent,
        amount: hoursSpent * rate,
      });
    }

    const projects = new Map<string, IWorkloadItem>();
    const sprints = new Map<string, IWorkloadItem>();
    const types = new Map<string, IWorkloadItem>();
    const assignees = new Map<string, IWorkloadItem>();
    const statuses = new Map<string, IWorkloadItem>();
    const tasks: IWorkloadTask[] = [];

    for (const task of allTasks.data) {
      // Безопасные проверки для вложенных и опциональных полей
      const project = task.project?.primary
        ? { key: task.project.primary.id, display: task.project.primary.display }
        : { key: 'unknown', display: 'Unknown Project' };
      const sprintArr = Array.isArray(task.sprint)
        ? (task.sprint
            .map((s) => (s && s.id && s.display ? { key: s.id, display: s.display } : null))
            .filter(Boolean) as IWorkloadItem[])
        : [];
      const type = task.type
        ? { key: task.type.id, display: task.type.display }
        : { key: 'unknown', display: 'Unknown Type' };
      const assignee =
        task.assignee && task.assignee.id && task.assignee.display
          ? { key: task.assignee.id, display: task.assignee.display }
          : undefined;
      const status =
        task.status && task.status.key && task.status.display
          ? { key: task.status.key, display: task.status.display }
          : { key: 'unknown', display: 'Unknown Status' };
      const worklogs = worklogByTask.get(task.key) || [];
      const totalHoursSpent = (worklogs ?? []).reduce((sum, wl) => sum + (wl?.hoursSpent ?? 0), 0);
      const totalAmount = (worklogs ?? []).reduce((sum, wl) => sum + (wl?.amount ?? 0), 0);

      projects.set(project.key, project);
      sprintArr.forEach((s) => sprints.set(s.key, s));
      types.set(type.key, type);
      if (assignee) assignees.set(assignee.key, assignee);
      statuses.set(status.key, status);

      const deltaTime =
        task.resolvedAt && task.deadline
          ? (new Date(task.resolvedAt).getTime() - this.getEndOfDay(task.deadline).getTime()) / 1000 / 3600
          : null;

      tasks.push({
        key: task.key,
        createdAt: task.createdAt,
        deadline: task.deadline || null,
        resolvedAt: task.resolvedAt ? new Date(task.resolvedAt).toISOString().slice(0, 10) : null,
        deltaTime: Number(deltaTime?.toFixed(1)),
        summary: task.summary ?? '',
        description: task.description ?? '',
        worklogs,
        hoursSpent: totalHoursSpent,
        amount: totalAmount,
        statusKey: task.status?.key ?? 'unknown',
        typeKey: task.type?.key ?? 'unknown',
        assigneeId: task.assignee?.id ?? null,
        projectId: task.project?.primary?.id ?? null,
        sprintKey: sprintArr.length ? sprintArr[sprintArr.length - 1].key : null,
        parentKey: task.parent?.key ?? null,
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
    const toDate = params.to ? this.getEndOfDay(params.to) : defaultTo;

    const toIsoString = (val: Date) => val.toISOString();
    const toShortDate = (val: Date) => val.toISOString().slice(0, 10);

    return {
      fromIso: toIsoString(fromDate),
      toIso: toIsoString(toDate),
      fromShort: toShortDate(fromDate),
      toShort: toShortDate(toDate),
    };
  }

  private getEndOfDay(dateStr: string): Date {
    const date = new Date(dateStr);
    date.setHours(23, 59, 59, 999);
    return date;
  }
}
