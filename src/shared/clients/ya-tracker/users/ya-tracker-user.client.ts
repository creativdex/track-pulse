import { Logger } from '@nestjs/common';
import { IClientResult } from '@src/shared/types/client-result.type';
import { EContentType, EHttpMethod } from '@src/shared/abstract/http-client/http-client.abstract.enum';
import { YaTrackerClient } from '../ya-tracker.client';
import { IHttpRequestOptions } from '@src/shared/abstract/http-client/http-client.abstract.interface';
import { ITrackerUser } from './models/user.model';
import { ITrackerGetUser } from './models/get-user.model';
import { IPaginateMeta } from '@src/shared/clients/ya-tracker/ya-tracker.model';

export class YaTrackerUserClient {
  private readonly logger = new Logger(YaTrackerUserClient.name);

  constructor(private readonly baseClient: YaTrackerClient) {}

  /**
   * Получает пользователей из в Яндекс.Трекера
   * @returns Результат получения пользователей
   */
  async getUsers(): Promise<IClientResult<ITrackerUser[]>> {
    this.logger.log('Getting users');

    const options: IHttpRequestOptions<void> = {
      method: EHttpMethod.GET,
      endpoint: 'users',
      contentType: EContentType.JSON,
    };

    return this.baseClient.makeRequest<ITrackerUser[], void>(options, 'get_users');
  }

  async getAllUsers(): Promise<IClientResult<ITrackerUser[]>> {
    const allUsers: ITrackerUser[] = [];

    await this.getByPaginateUsers((users: ITrackerUser[]) => {
      allUsers.push(...users);
    });

    this.logger.log('All users fetched', { count: allUsers.length });

    return {
      success: true,
      data: allUsers,
    };
  }

  async getByPaginateUsers(
    onPage: (users: ITrackerUser[], meta: IPaginateMeta) => Promise<void> | void,
  ): Promise<void> {
    this.logger.log('Getting paginated users');

    const options: IHttpRequestOptions<void> = {
      method: EHttpMethod.GET,
      endpoint: 'users',
      contentType: EContentType.JSON,
    };

    return this.baseClient.requestAllData<ITrackerUser[]>(options, 'get_paginated_users', onPage, 'paginate');
  }

  /**
   * Получает информацию по пользователю
   * @param payload - Данные для получения пользователя
   * @returns Данные пользователя
   */
  async getUser(payload: ITrackerGetUser): Promise<IClientResult<ITrackerUser>> {
    this.logger.log('Getting user', { userId: payload.userId });

    const options: IHttpRequestOptions<void> = {
      method: EHttpMethod.GET,
      endpoint: `users/${payload.userId}`,
      params: payload,
      contentType: EContentType.JSON,
    };

    return this.baseClient.makeRequest<ITrackerUser>(options, 'get_user');
  }
}
