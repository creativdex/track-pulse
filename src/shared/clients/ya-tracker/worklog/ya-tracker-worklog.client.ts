import { Logger } from '@nestjs/common';
import { IClientResult } from '@src/shared/types/client-result.type';
import { EContentType, EHttpMethod } from '@src/shared/abstract/http-client/http-client.abstract.enum';
import { YaTrackerClient } from '../ya-tracker.client';
import { IHttpRequestOptions } from '@src/shared/abstract/http-client/http-client.abstract.interface';
import { ITrackerWorklog } from './models/worklog.model';
import { ITrackerGetByTaskWorklog } from './models/get-by-task-worklog.model';
import { ITrackerGetByQueryWorklog } from './models/get-by-query-worklog.model';

export class YaTrackerWorklogClient {
  private readonly logger = new Logger(YaTrackerWorklogClient.name);

  constructor(private readonly baseClient: YaTrackerClient) {}

  /**
   * Получает записи о затраченом времени из в Яндекс.Трекера
   * @returns Результат получения записей о затраченом времени
   */
  async getByTaskWorklog(payload: ITrackerGetByTaskWorklog): Promise<IClientResult<ITrackerWorklog[]>> {
    this.logger.log('Getting worklogs by task', { data: payload.taskId });

    const options: IHttpRequestOptions<void> = {
      method: EHttpMethod.GET,
      endpoint: `issues/${payload.taskId}/worklog`,
      contentType: EContentType.JSON,
    };

    return this.baseClient.makeRequest<ITrackerWorklog[], void>(options, 'get_worklogs_by_task');
  }

  /**
   * Получает записи о затраченом времени по запросу
   * @param payload - Данные для получения записей о затраченом времени
   * @returns Данные записей о затраченом времени
   */
  async getByQueryWorklog(payload: ITrackerGetByQueryWorklog): Promise<IClientResult<ITrackerWorklog[]>> {
    this.logger.log('Getting worklogs by query', { data: payload });

    const options: IHttpRequestOptions<ITrackerGetByQueryWorklog> = {
      method: EHttpMethod.POST,
      endpoint: `worklog/_search`,
      data: payload,
      contentType: EContentType.JSON,
    };

    return this.baseClient.makeRequest<ITrackerWorklog[], ITrackerGetByQueryWorklog>(options, 'get_worklogs_by_query');
  }
}
