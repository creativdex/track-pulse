import { Logger } from '@nestjs/common';
import { YaTrackerClient } from '../ya-tracker.client';
import { ITrackerGetEntity } from './models/get-entity.model';
import { IClientResult } from '@src/shared/types/client-result.type';
import { ITrackerEntity } from './models/entity.model';
import { IHttpRequestOptions } from '@src/shared/abstract/http-client/http-client.abstract.interface';
import {
  ITrackerSearchEntity,
  ITrackerSearchEntityBody,
  ITrackerSearchEntityResult,
} from './models/search-entity.models';
import { EHttpMethod } from '@src/shared/abstract/http-client/http-client.abstract.enum';

export class YaTrackerEntityClient {
  private readonly logger = new Logger(YaTrackerEntityClient.name);

  constructor(private readonly baseClient: YaTrackerClient) {}

  /**
   * Получает сущность по типу и ID
   * @param paylaod - Параметры запроса
   * @returns Результат запроса с сущностью
   */
  async getEntity(paylaod: ITrackerGetEntity): Promise<IClientResult<ITrackerEntity>> {
    this.logger.log('Getting entity', { typeEntity: paylaod.path.typeEntity, id: paylaod.path.id });

    const options: IHttpRequestOptions = {
      method: EHttpMethod.GET,
      endpoint: `entities/${paylaod.path.typeEntity}/${paylaod.path.id}`,
      params: paylaod.query,
      contentType: 'application/json',
    };

    return this.baseClient.makeRequest<ITrackerEntity>(options, 'get_entity');
  }

  /**
   * Ищет сущности по типу и параметрам
   * @param payload - Параметры запроса
   * @returns Результат поиска сущностей
   */
  async searchEntity(payload: ITrackerSearchEntity): Promise<IClientResult<ITrackerSearchEntityResult>> {
    this.logger.log('Searching entity', { typeEntity: payload.path.typeEntity });

    const options: IHttpRequestOptions<ITrackerSearchEntityBody> = {
      method: EHttpMethod.POST,
      endpoint: `entities/${payload.path.typeEntity}/_search`,
      params: payload.query,
      data: payload.body,
      contentType: 'application/json',
    };

    return this.baseClient.makeRequest<ITrackerSearchEntityResult, ITrackerSearchEntityBody>(options, 'search_entity');
  }
}
