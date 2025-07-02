import { Injectable, Logger } from '@nestjs/common';
import { YaTrackerClient } from '@src/shared/clients/ya-tracker/ya-tracker.client';
import { IServiceResult } from '@src/shared/types/service-result.type';
import { ITrackerQueue, ITrackerProject } from './models/reference.model';
import { ITrackerQueue as IApiTrackerQueue } from '@src/shared/clients/ya-tracker/queue/models/queue.model';

@Injectable()
export class TrackerReferenceService {
  protected readonly logger = new Logger(TrackerReferenceService.name);

  constructor(private readonly yaTrackerClient: YaTrackerClient) {}

  /**
   * Получает все доступные очереди из Яндекс.Трекера
   * @returns Список очередей или ошибка
   */
  async getAllQueues(): Promise<IServiceResult<ITrackerQueue[]>> {
    this.logger.log('Fetching all queues from YaTracker');

    try {
      // Вызываем реальный API YaTracker для получения всех очередей
      const queuesResponse = await this.yaTrackerClient.queue.getQueuesToArray({}, { strategy: 'scroll' });

      if (!queuesResponse.success) {
        this.logger.error('Failed to fetch queues from YaTracker:', queuesResponse.error);
        return {
          success: false,
          error:
            typeof queuesResponse.error === 'string' ? queuesResponse.error : 'Failed to fetch queues from YaTracker',
        };
      }

      // Преобразуем данные в наш формат
      const queues: ITrackerQueue[] = queuesResponse.data.map((queue: IApiTrackerQueue) => ({
        key: queue.key,
        id: queue.id,
        name: queue.name,
        display: queue.name,
      }));

      this.logger.log(`Found ${queues.length} queues`);
      return {
        success: true,
        data: queues,
      };
    } catch (error) {
      this.logger.error('Failed to fetch queues from YaTracker:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Получает все доступные очереди из Яндекс.Трекера
   * @returns Список очередей или ошибка
   */
  getAllQueuesFake(): IServiceResult<ITrackerQueue[]> {
    return {
      success: true,
      data: [
        {
          id: 11,
          key: 'ZOTA',
          name: 'Zota',
        },
        {
          id: 12,
          key: 'FR',
          name: 'Prisma',
        },
      ],
    };
  }

  /**
   * Получает все доступные проекты из Яндекс.Трекера
   * @returns Список проектов или ошибка
   */
  async getAllProjects(): Promise<IServiceResult<ITrackerProject[]>> {
    this.logger.log('Fetching all projects from YaTracker');

    try {
      // Вызываем реальный API YaTracker для получения всех проектов
      const projectsResponse = await this.yaTrackerClient.entity.searchProjectsToArray({
        strategy: 'scroll',
      });

      if (!projectsResponse.success) {
        this.logger.error('Failed to fetch projects from YaTracker:', projectsResponse.error);
        return {
          success: false,
          error:
            typeof projectsResponse.error === 'string'
              ? projectsResponse.error
              : 'Failed to fetch projects from YaTracker',
        };
      }

      // Отфильтровываем только нужные поля для reference
      const projects: ITrackerProject[] = projectsResponse.data.map((project) => ({
        id: project.shortId,
        key: project.id,
        name: project.fields?.summary || 'Unknown Project', // Используем summary или 'Unknown Project' если нет
      }));

      this.logger.log(`Found ${projects.length} projects`);
      return {
        success: true,
        data: projects,
      };
    } catch (error) {
      this.logger.error('Failed to fetch projects from YaTracker:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Получает очередь по ключу
   * @param queueKey - Ключ очереди
   * @returns Очередь или ошибка
   */
  async getQueueByKey(queueKey: string): Promise<IServiceResult<ITrackerQueue>> {
    this.logger.log(`Fetching queue by key: ${queueKey}`);

    const queuesResult = await this.getAllQueues();
    if (!queuesResult.success) {
      return queuesResult;
    }

    const queue = queuesResult.data.find((q) => q.key === queueKey);
    if (!queue) {
      this.logger.warn(`Queue with key ${queueKey} not found`);
      return {
        success: false,
        error: `Queue with key ${queueKey} not found`,
      };
    }

    this.logger.log(`Queue with key ${queueKey} found`);
    return {
      success: true,
      data: queue,
    };
  }
}
