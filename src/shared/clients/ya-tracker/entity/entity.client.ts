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
  ISearchEntityOptions,
} from './models/search-entity.models';
import { EHttpMethod, EContentType } from '@src/shared/abstract/http-client/http-client.abstract.enum';
import { IScrollMeta, IPaginateMeta } from '../ya-tracker.model';
import { ETrackerEntityType } from './entity.enum';

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
   * Ищет сущности по типу и параметрам с автоматическим выбором стратегии пагинации
   * @param searchRequest - Критерии поиска сущностей
   * @param options - Дополнительные опции поиска
   * @param onPage - Колбэк для обработки каждой страницы результатов
   */
  async searchEntity(
    searchRequest: ITrackerSearchEntity,
    options: ISearchEntityOptions = {},
    onPage: (entities: ITrackerEntity[], meta: IScrollMeta | IPaginateMeta) => Promise<void> | void,
  ): Promise<void> {
    this.logger.log('Searching entities', {
      typeEntity: searchRequest.path.typeEntity,
      hasFilter: !!searchRequest.body?.filter,
      hasInput: !!searchRequest.body?.input,
      strategy: options.strategy,
    });

    const queryParams = this.buildSearchQueryParams(searchRequest.query);

    const requestOptions: IHttpRequestOptions<ITrackerSearchEntityBody> = {
      method: EHttpMethod.POST,
      endpoint: `entities/${searchRequest.path.typeEntity}/_search`,
      data: searchRequest.body,
      contentType: EContentType.JSON,
      params: queryParams,
    };

    return this.baseClient.requestAllData<ITrackerSearchEntityResult, ITrackerSearchEntityBody>(
      requestOptions,
      'search_entities',
      async (data: ITrackerSearchEntityResult, meta: IScrollMeta | IPaginateMeta) => {
        // Извлекаем массив сущностей из результата и передаем в колбэк
        await onPage(data.values, meta);
      },
      options.strategy,
    );
  }

  /**
   * Ищет сущности и возвращает все результаты в виде массива
   * @param searchRequest - Критерии поиска сущностей
   * @param options - Дополнительные опции поиска
   * @returns Массив найденных сущностей
   */
  async searchEntityToArray(
    searchRequest: ITrackerSearchEntity,
    options: ISearchEntityOptions = {},
  ): Promise<IClientResult<ITrackerEntity[]>> {
    const allEntities: ITrackerEntity[] = [];

    await this.searchEntity(searchRequest, options, (entities: ITrackerEntity[]) => {
      allEntities.push(...entities);
    });

    this.logger.log(`Search completed`, { totalEntities: allEntities.length });
    return { success: true, data: allEntities };
  }

  /**
   * Ищет проекты и возвращает все результаты в виде массива
   * @param options - Дополнительные опции поиска
   * @returns Массив найденных проектов
   */
  async searchProjectsToArray(options: ISearchEntityOptions = {}): Promise<IClientResult<ITrackerEntity[]>> {
    const searchRequest: ITrackerSearchEntity = {
      path: { typeEntity: ETrackerEntityType.PROJECT },
      query: {
        fields:
          'id,shortId,summary,description,author,lead,teamUsers,clients,followers,start,end,checklistItems,tags,parentEntity,teamAccess,quarter,entityStatus,issueQueues',
      },
    };

    return this.searchEntityToArray(searchRequest, options);
  }

  /**
   * Построение параметров запроса для поиска
   * @param queryParams - Исходные параметры запроса
   * @returns Обработанные параметры
   */
  private buildSearchQueryParams(queryParams?: Record<string, unknown>): Record<string, string> {
    if (!queryParams) return {};

    const params: Record<string, string> = {};

    // Преобразуем все параметры в строки
    Object.keys(queryParams).forEach((key) => {
      const value = queryParams[key];
      if (value !== undefined && value !== null) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          params[key] = String(value);
        } else if (typeof value === 'object') {
          // Для объектов используем JSON.stringify
          params[key] = JSON.stringify(value);
        }
        // Для других типов (например, функций) игнорируем
      }
    });

    return params;
  }
}
