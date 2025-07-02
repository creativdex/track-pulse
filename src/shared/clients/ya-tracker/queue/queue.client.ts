import { Logger } from '@nestjs/common';
import { YaTrackerClient } from '../ya-tracker.client';
import { IClientResult } from '@src/shared/types/client-result.type';
import { ITrackerQueue } from './models/queue.model';
import { IGetQueuesQuery, IGetQueuesOptions } from './models/get-queues.model';
import { IHttpRequestOptions } from '@src/shared/abstract/http-client/http-client.abstract.interface';
import { EHttpMethod } from '@src/shared/abstract/http-client/http-client.abstract.enum';
import { IScrollMeta, IPaginateMeta } from '../ya-tracker.model';

export class YaTrackerQueueClient {
  private readonly logger = new Logger(YaTrackerQueueClient.name);

  constructor(private readonly baseClient: YaTrackerClient) {}

  /**
   * Получает все очереди с автоматическим выбором стратегии пагинации
   * @param query - Параметры запроса
   * @param options - Дополнительные опции поиска
   * @param onPage - Колбэк для обработки каждой страницы результатов
   */
  async getQueues(
    query: IGetQueuesQuery = {},
    options: IGetQueuesOptions = {},
    onPage: (queues: ITrackerQueue[], meta: IScrollMeta | IPaginateMeta) => Promise<void> | void,
  ): Promise<void> {
    this.logger.log('Getting queues', {
      expand: query.expand,
      perPage: query.perPage,
      strategy: options.strategy,
    });

    const queryParams = this.buildGetQueuesQueryParams(query);

    const requestOptions: IHttpRequestOptions = {
      method: EHttpMethod.GET,
      endpoint: 'queues',
      params: queryParams,
      contentType: 'application/json',
    };

    return this.baseClient.requestAllData<ITrackerQueue[]>(
      requestOptions,
      'get_queues',
      async (data: ITrackerQueue[], meta: IScrollMeta | IPaginateMeta) => {
        // Данные уже приходят как массив очередей
        await onPage(data, meta);
      },
      options.strategy,
    );
  }

  /**
   * Получает все очереди и возвращает все результаты в виде массива
   * @param query - Параметры запроса
   * @param options - Дополнительные опции поиска
   * @returns Массив найденных очередей
   */
  async getQueuesToArray(
    query: IGetQueuesQuery = {},
    options: IGetQueuesOptions = {},
  ): Promise<IClientResult<ITrackerQueue[]>> {
    const allQueues: ITrackerQueue[] = [];

    await this.getQueues(query, options, (queues: ITrackerQueue[]) => {
      allQueues.push(...queues);
    });

    this.logger.log(`Get queues completed`, { totalQueues: allQueues.length });
    return { success: true, data: allQueues };
  }

  /**
   * Построение параметров запроса для получения очередей
   * @param queryParams - Исходные параметры запроса
   * @returns Обработанные параметры
   */
  private buildGetQueuesQueryParams(queryParams?: IGetQueuesQuery): Record<string, string> {
    if (!queryParams) return {};

    const params: Record<string, string> = {};

    // Преобразуем все параметры в строки
    Object.keys(queryParams).forEach((key) => {
      const value = queryParams[key as keyof IGetQueuesQuery];
      if (value !== undefined && value !== null) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          params[key] = String(value);
        }
      }
    });

    return params;
  }
}
