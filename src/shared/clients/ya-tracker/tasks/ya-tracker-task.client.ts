import { Logger } from '@nestjs/common';
import { IClientResult } from '@src/shared/types/client-result.type';
import { EContentType, EHttpMethod } from '@src/shared/abstract/http-client/http-client.abstract.enum';
import { ICreateTask } from './models/create-task.model';
import { ITrackerTask } from './models/task.model';
import { YaTrackerClient } from '../ya-tracker.client';
import { IHttpRequestOptions } from '@src/shared/abstract/http-client/http-client.abstract.interface';
import { ISearchTasksRequest, ISearchTasksOptions, IExpandParameters } from './models/search-tasks.model';
import { IScrollMeta, IPaginateMeta } from '../ya-tracker.model';

export class YaTrackerTaskClient {
  private readonly logger = new Logger(YaTrackerTaskClient.name);

  constructor(private readonly baseClient: YaTrackerClient) {}

  /**
   * Создает новую задачу в Яндекс.Трекере
   * @param payload - Данные для создания задачи
   * @returns Результат создания задачи
   */
  async createTask(payload: ICreateTask): Promise<IClientResult<ITrackerTask>> {
    this.logger.log('Creating task', { summary: payload.summary });

    const options: IHttpRequestOptions<ICreateTask> = {
      method: EHttpMethod.POST,
      endpoint: 'issues',
      data: payload,
      contentType: EContentType.JSON,
    };

    return this.baseClient.makeRequest<ITrackerTask, ICreateTask>(options, 'create_task');
  }

  /**
   * Получает задачу по ключу
   * @param taskKey - Ключ задачи
   * @returns Данные задачи
   */
  async getTask(taskKey: string): Promise<IClientResult<ITrackerTask>> {
    this.logger.log('Getting task', { taskKey });

    const options: IHttpRequestOptions<void> = {
      method: EHttpMethod.GET,
      endpoint: `issues/${taskKey}`,
      contentType: EContentType.JSON,
    };

    return this.baseClient.makeRequest<ITrackerTask>(options, 'get_task');
  }

  /**
   * Ищет задачи по заданным критериям с автоматическим выбором стратегии пагинации
   * @param searchRequest - Критерии поиска
   * @param options - Дополнительные опции поиска
   * @param onPage - Колбэк для обработки каждой страницы результатов
   */
  async searchTasks(
    searchRequest: ISearchTasksRequest,
    options: ISearchTasksOptions = {},
    onPage: (tasks: ITrackerTask[], meta: IScrollMeta | IPaginateMeta) => Promise<void> | void,
  ): Promise<void> {
    this.logger.log('Searching tasks', {
      hasFilter: !!searchRequest.filter,
      hasQuery: !!searchRequest.query,
      queue: searchRequest.queue,
      strategy: options.strategy,
    });

    const queryParams = this.buildSearchQueryParams(options.expand);

    const requestOptions: IHttpRequestOptions<ISearchTasksRequest> = {
      method: EHttpMethod.POST,
      endpoint: 'issues/_search',
      data: searchRequest,
      contentType: EContentType.JSON,
      params: queryParams,
    };

    return this.baseClient.requestAllData<ITrackerTask[], ISearchTasksRequest>(
      requestOptions,
      'search_tasks',
      onPage,
      options.strategy,
    );
  }

  /**
   * Ищет задачи и возвращает все результаты в виде массива
   * @param searchRequest - Критерии поиска
   * @param options - Дополнительные опции поиска
   * @returns Массив найденных зPадач
   */
  async searchTasksToArray(
    searchRequest: ISearchTasksRequest,
    options: ISearchTasksOptions = {},
  ): Promise<ITrackerTask[]> {
    const allTasks: ITrackerTask[] = [];

    await this.searchTasks(searchRequest, options, (tasks: ITrackerTask[]) => {
      allTasks.push(...tasks);
    });

    this.logger.log(`Search completed`, { totalTasks: allTasks.length });
    return allTasks;
  }

  /**
   * Ищет задачи по очереди
   * @param queueKey - Ключ очереди
   * @param options - Дополнительные опции поиска
   * @param onPage - Колбэк для обработки каждой страницы результатов
   */
  async searchTasksByQueue(
    queueKey: string,
    options: ISearchTasksOptions = {},
    onPage: (tasks: ITrackerTask[], meta: IScrollMeta | IPaginateMeta) => Promise<void> | void,
  ): Promise<void> {
    return this.searchTasks({ queue: queueKey }, options, onPage);
  }

  /**
   * Ищет задачи по ключам
   * @param keys - Ключи задач
   * @param options - Дополнительные опции поиска
   * @param onPage - Колбэк для обработки каждой страницы результатов
   */
  async searchTasksByKeys(
    keys: string | string[],
    options: ISearchTasksOptions = {},
    onPage: (tasks: ITrackerTask[], meta: IScrollMeta | IPaginateMeta) => Promise<void> | void,
  ): Promise<void> {
    return this.searchTasks({ keys }, options, onPage);
  }

  /**
   * Ищет задачи по фильтру
   * @param filter - Объект фильтра
   * @param order - Порядок сортировки
   * @param options - Дополнительные опции поиска
   * @param onPage - Колбэк для обработки каждой страницы результатов
   */
  async searchTasksByFilter(
    filter: Record<string, unknown>,
    onPage: (tasks: ITrackerTask[], meta: IScrollMeta | IPaginateMeta) => Promise<void> | void,
    order?: string,
    options: ISearchTasksOptions = {},
  ): Promise<void> {
    return this.searchTasks({ filter, order }, options, onPage);
  }

  /**
   * Ищет задачи по языку запросов
   * @param query - Запрос на языке запросов Яндекс.Трекера
   * @param options - Дополнительные опции поиска
   * @param onPage - Колбэк для обработки каждой страницы результатов
   */
  async searchTasksByQuery(
    query: string,
    options: ISearchTasksOptions = {},
    onPage: (tasks: ITrackerTask[], meta: IScrollMeta | IPaginateMeta) => Promise<void> | void,
  ): Promise<void> {
    return this.searchTasks({ query }, options, onPage);
  }

  /**
   * Формирует параметры запроса для expand
   * @param expand - Параметры expand
   * @returns Объект с параметрами запроса
   */
  private buildSearchQueryParams(expand?: IExpandParameters): Record<string, string> {
    const params: Record<string, string> = {};

    if (expand) {
      const expandValues: string[] = [];

      if (expand.transitions) {
        expandValues.push('transitions');
      }

      if (expand.attachments) {
        expandValues.push('attachments');
      }

      if (expandValues.length > 0) {
        params.expand = expandValues.join(',');
      }
    }

    return params;
  }
}
