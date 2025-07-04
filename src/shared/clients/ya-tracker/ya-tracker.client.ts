import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { YaTrackerTaskClient } from './tasks/ya-tracker-task.client';
import { AbstractHttpClient } from '@src/shared/abstract/http-client/http-client.abstract';
import { IHttpRequestOptions } from '@src/shared/abstract/http-client/http-client.abstract.interface';
import { IClientResult } from '@src/shared/types/client-result.type';
import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { IScrollMeta, IPaginateMeta, IScrollOptions, IPaginateOptions } from './ya-tracker.model';
import { PAGINATION_CONSTANTS } from './ya-tracker.const';
import { YaTrackerUserClient } from './users/ya-tracker-user.client';
import { YaTrackerWorklogClient } from './worklog/ya-tracker-worklog.client';
import { YaTrackerEntityClient } from './entity/entity.client';
import { YaTrackerQueueClient } from './queue/queue.client';
import * as jose from 'jose';

@Injectable()
export class YaTrackerClient extends AbstractHttpClient {
  private readonly logger = new Logger(YaTrackerClient.name);
  private readonly cloudOrgId: string;
  private readonly oauthToken: string;
  private iamToken?: string;
  private iamTokenExpiry?: number;
  private readonly useIamAuth: boolean;

  private readonly serviceAccountId: string;
  private readonly serviceAccountIdKey: string;
  private readonly serviceAccountPrivateKey: string;

  public readonly tasks: YaTrackerTaskClient;
  public readonly users: YaTrackerUserClient;
  public readonly worklog: YaTrackerWorklogClient;
  public readonly entity: YaTrackerEntityClient;
  public readonly queue: YaTrackerQueueClient;

  constructor(private configService: ConfigService) {
    const apiUrl = configService.getOrThrow<string>('ENV__YA_TRACKER_API_URL');
    super(apiUrl);

    this.cloudOrgId = configService.getOrThrow<string>('ENV__YA_TRACKER_ORG_ID');
    this.oauthToken = configService.getOrThrow<string>('SECRET__YA_TRACKER_OAUTH_TOKEN');

    // IAM конфигурация (опциональная)
    this.useIamAuth = configService.get<boolean>('ENV__YA_TRACKER_USE_IAM', false);
    this.serviceAccountId = configService.get<string>('ENV__YA_TRACKER_SERVICE_ACC_ID') || '';
    this.serviceAccountIdKey = configService.get<string>('SECRET__YA_TRACKER_ID_KEY') || '';
    this.serviceAccountPrivateKey = configService.get<string>('SECRET__YA_TRACKER_PRIVATE_KEY') || '';

    this.tasks = new YaTrackerTaskClient(this);
    this.users = new YaTrackerUserClient(this);
    this.worklog = new YaTrackerWorklogClient(this);
    this.entity = new YaTrackerEntityClient(this);
    this.queue = new YaTrackerQueueClient(this);
  }

  /**
   * Выполняет HTTP-запрос к API Яндекс.Трекера с автоматическим добавлением заголовков авторизации
   * @param options - Опции HTTP-запроса
   * @param operation - Название операции для логирования
   * @returns Результат выполнения запроса
   */
  public async makeRequest<TResponseBody, TRequestBody = unknown>(
    options: IHttpRequestOptions<TRequestBody>,
    operation: string,
  ): Promise<IClientResult<TResponseBody>> {
    const enhancedOptions: IHttpRequestOptions<TRequestBody> = {
      ...options,
      headers: {
        ...(await this.getAuthHeaders()),
        ...options.headers,
      },
    };

    return this.sendRequest<TResponseBody, TRequestBody>(enhancedOptions, operation);
  }

  /**
   * Выполняет scroll-запрос с автоматической прокруткой всех страниц данных
   * @param options - Опции scroll-запроса
   * @param operation - Название операции для логирования
   * @param onPage - Колбэк для обработки каждой порции данных
   */
  public async scrollRequest<TResponse, TRequest = unknown>(
    options: IScrollOptions<TRequest>,
    operation: string,
    onPage: (data: TResponse, meta: IScrollMeta) => Promise<void> | void,
  ): Promise<void> {
    let scrollId: string | undefined;
    let isLast = false;
    let iterationCount = 0;

    try {
      do {
        if (iterationCount++ > PAGINATION_CONSTANTS.MAX_ITERATIONS) {
          throw new Error(`Max iterations (${PAGINATION_CONSTANTS.MAX_ITERATIONS}) exceeded in scroll request`);
        }

        const baseParams = this.buildScrollParams(options, scrollId);

        const reqOptions: IHttpRequestOptions<TRequest> = {
          ...options,
          params: { ...baseParams, ...options.params },
          headers: { ...(await this.getAuthHeaders()), ...options.headers },
        };

        const response = await this.sendRequestRawResult<TResponse, TRequest>(reqOptions, operation);
        const { scrollId: nextScrollId, totalCount } = this.extractScrollHeaders(response.headers);

        scrollId = nextScrollId;
        isLast = !scrollId;

        if (!response.data) {
          this.logger.warn(`[${operation}] Empty response data received, stopping scroll`);
          break;
        }

        await onPage(response.data, { scrollId, totalCount, isLast });
      } while (!isLast);
    } catch (error) {
      this.logger.error(`[${operation}] Scroll request failed`, {
        error: this.extractErrorDetails(error),
        iterationCount,
        scrollId,
      });
      throw error;
    }
  }

  /**
   * Выполняет пагинированный запрос с автоматическим переходом по всем страницам
   * @param options - Опции пагинированного запроса
   * @param operation - Название операции для логирования
   * @param onPage - Колбэк для обработки каждой страницы данных
   */
  public async paginateRequest<TResponse, TRequest = unknown>(
    options: IPaginateOptions<TRequest>,
    operation: string,
    onPage: (data: TResponse, meta: IPaginateMeta) => Promise<void> | void,
  ): Promise<void> {
    let page = options.pageStart ?? PAGINATION_CONSTANTS.DEFAULT_PAGE_START;
    let isLast = false;
    let iterationCount = 0;

    try {
      do {
        if (iterationCount++ > PAGINATION_CONSTANTS.MAX_ITERATIONS) {
          throw new Error(`Max iterations (${PAGINATION_CONSTANTS.MAX_ITERATIONS}) exceeded in paginate request`);
        }

        const perPage =
          options.perPage !== undefined
            ? Math.min(Math.max(1, options.perPage), PAGINATION_CONSTANTS.MAX_PER_PAGE)
            : PAGINATION_CONSTANTS.DEFAULT_PER_PAGE;

        const reqOptions: IHttpRequestOptions<TRequest> = {
          ...options,
          params: {
            perPage: String(perPage),
            page: String(page),
            ...options.params,
          },
          headers: { ...(await this.getAuthHeaders()), ...options.headers },
        };

        const response = await this.sendRequestRawResult<TResponse, TRequest>(reqOptions, operation);
        const { totalPages, totalCount } = this.extractPaginationHeaders(response.headers);

        isLast = totalPages ? page >= totalPages : true;

        if (!response.data) {
          this.logger.warn(`[${operation}] Empty response data received on page ${page}, stopping pagination`);
          break;
        }

        await onPage(response.data, { page, totalPages, totalCount, isLast });
        page++;
      } while (!isLast);
    } catch (error) {
      this.logger.error(`[${operation}] Paginate request failed`, {
        error: this.extractErrorDetails(error),
        iterationCount,
        currentPage: page,
      });
      throw error;
    }
  }

  /**
   * Универсальный метод для получения всех данных с автоматическим выбором стратегии
   * @param options - Базовые опции запроса
   * @param operation - Название операции для логирования
   * @param onPage - Колбэк для обработки каждой порции данных
   * @param strategy - Принудительная стратегия (опционально)
   */
  public async requestAllData<TResponse, TRequest = unknown>(
    options: IHttpRequestOptions<TRequest>,
    operation: string,
    onPage: (data: TResponse, meta: IScrollMeta | IPaginateMeta) => Promise<void> | void,
    strategy?: 'scroll' | 'paginate',
  ): Promise<void> {
    if (strategy) {
      if (strategy === 'scroll') {
        const scrollOptions: IScrollOptions<TRequest> = {
          ...options,
          scrollType: 'sorted',
        };
        return this.scrollRequest(scrollOptions, operation, (data: TResponse, meta: IScrollMeta) => onPage(data, meta));
      } else {
        const paginateOptions: IPaginateOptions<TRequest> = options;
        return this.paginateRequest(paginateOptions, operation, (data: TResponse, meta: IPaginateMeta) =>
          onPage(data, meta),
        );
      }
    }

    // Автоматическое определение стратегии на основе первого запроса
    const testResponse = await this.sendRequestRawResult<TResponse, TRequest>(
      {
        ...options,
        params: {
          ...options.params,
          perPage: '1',
          page: '1',
        },
        headers: { ...(await this.getAuthHeaders()), ...options.headers },
      },
      `${operation}_strategy_detection`,
    );

    const headers = testResponse.headers as Record<string, unknown> | undefined;
    const hasScrollHeaders = headers && this.getHeaderValue(headers, 'x-scroll-id');
    const hasPaginationHeaders = headers && this.getNumericHeaderValue(headers, 'x-total-pages');

    if (hasScrollHeaders) {
      this.logger.debug(`[${operation}] Auto-detected scroll strategy`);
      const scrollOptions: IScrollOptions<TRequest> = {
        ...options,
        scrollType: 'sorted',
      };
      return this.scrollRequest(scrollOptions, operation, (data: TResponse, meta: IScrollMeta) => onPage(data, meta));
    } else if (hasPaginationHeaders) {
      this.logger.debug(`[${operation}] Auto-detected pagination strategy`);
      const paginateOptions: IPaginateOptions<TRequest> = options;
      return this.paginateRequest(paginateOptions, operation, (data: TResponse, meta: IPaginateMeta) =>
        onPage(data, meta),
      );
    } else {
      throw new Error(`Unable to determine pagination strategy for operation: ${operation}`);
    }
  }

  /**
   * Определяет доступные стратегии пагинации для endpoint
   * @param options - Базовые опции запроса
   * @param operation - Название операции для логирования
   * @returns Массив доступных стратегий
   */
  public async detectPaginationStrategies<TRequest = unknown>(
    options: IHttpRequestOptions<TRequest>,
    operation: string,
  ): Promise<Array<'scroll' | 'paginate'>> {
    const strategies: Array<'scroll' | 'paginate'> = [];

    try {
      // Проверяем поддержку пагинации
      const paginateResponse = await this.sendRequestRawResult<unknown, TRequest>(
        {
          ...options,
          params: {
            ...options.params,
            perPage: '1',
            page: '1',
          },
          headers: { ...(await this.getAuthHeaders()), ...options.headers },
        },
        `${operation}_pagination_check`,
      );

      const paginateHeaders = paginateResponse.headers as Record<string, unknown> | undefined;
      if (paginateHeaders && this.getNumericHeaderValue(paginateHeaders, 'x-total-pages')) {
        strategies.push('paginate');
      }
    } catch (error) {
      this.logger.debug(`[${operation}] Pagination not supported: ${this.extractErrorDetails(error)}`);
    }

    try {
      // Проверяем поддержку scroll
      const scrollResponse = await this.sendRequestRawResult<unknown, TRequest>(
        {
          ...options,
          params: {
            ...options.params,
            scrollType: 'sorted',
            perScroll: '1',
          },
          headers: { ...(await this.getAuthHeaders()), ...options.headers },
        },
        `${operation}_scroll_check`,
      );

      const scrollHeaders = scrollResponse.headers as Record<string, unknown> | undefined;
      if (scrollHeaders && this.getHeaderValue(scrollHeaders, 'x-scroll-id')) {
        strategies.push('scroll');
      }
    } catch (error) {
      this.logger.debug(`[${operation}] Scroll not supported: ${this.extractErrorDetails(error)}`);
    }

    return strategies;
  }

  /**
   * Получает IAM токен для авторизации в API Яндекс.Трекера
   * @returns Объект с IAM токеном
   */
  public async getIamToken(): Promise<IClientResult<{ iamToken: string }>> {
    const jwtToken = await this.generateJwtToken();
    const response = await this.sendRequestCustomBaseUrl<{ iamToken: string }>(
      {
        method: 'POST',
        endpoint: 'https://iam.api.cloud.yandex.net/iam/v1/tokens',
        data: { jwt: jwtToken },
      },
      'getIamToken',
    );
    return response;
  }

  /**
   * Генерирует JWT токен для авторизации через IAM
   * @returns Сгенерированный JWT токен
   */
  private async generateJwtToken(): Promise<string> {
    // 1.1. Формирование header
    const header = {
      typ: 'JWT',
      alg: 'PS256' as const,
      kid: this.serviceAccountIdKey,
    };

    // 1.2. Формирование payload
    const payload = {
      aud: 'https://iam.api.cloud.yandex.net/iam/v1/tokens',
      iss: this.serviceAccountId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
    };

    // 1.3. Подготовка приватного ключа
    let privateKeyPem = this.serviceAccountPrivateKey.trim();

    // Убираем комментарий Yandex Cloud если он есть
    // Формат: "PLEASE DO NOT REMOVE THIS LINE! Yandex.Cloud SA Key ID <key-id>\n-----BEGIN PRIVATE KEY-----"
    if (privateKeyPem.includes('PLEASE DO NOT REMOVE THIS LINE!')) {
      // Извлекаем только часть с ключом (от -----BEGIN до -----END)
      const beginIndex = privateKeyPem.indexOf('-----BEGIN PRIVATE KEY-----');
      if (beginIndex !== -1) {
        privateKeyPem = privateKeyPem.substring(beginIndex);
      }
    }

    // Добавляем заголовок и футер если их нет
    if (!privateKeyPem.startsWith('-----BEGIN')) {
      privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyPem}\n-----END PRIVATE KEY-----`;
    }

    // Заменяем \n на реальные переносы строк если нужно
    privateKeyPem = privateKeyPem.replace(/\\n/g, '\n');

    this.logger.debug('Private key format check', {
      startsWithBegin: privateKeyPem.startsWith('-----BEGIN'),
      endsWithEnd: privateKeyPem.endsWith('-----END PRIVATE KEY-----'),
      length: privateKeyPem.length,
    });

    try {
      // 1.4. Создание подписи и JWT токена
      const privateKey = await jose.importPKCS8(privateKeyPem, 'PS256');
      const jwt = await new jose.SignJWT(payload).setProtectedHeader(header).sign(privateKey);

      return jwt;
    } catch (error) {
      this.logger.error('Failed to generate JWT token', {
        error: this.extractErrorDetails(error),
        keyStartsWith: privateKeyPem.substring(0, 50),
        keyLength: privateKeyPem.length,
      });
      throw new Error(`JWT generation failed: ${this.extractErrorDetails(error)}`);
    }
  }

  /**
   * Формирует заголовки для авторизации в API Яндекс.Трекера
   * @returns Объект с заголовками авторизации
   */
  private getTrackerOAuthHeaders(): Record<string, string> {
    return {
      Authorization: `OAuth ${this.oauthToken}`,
      Host: 'api.tracker.yandex.net',
      'X-Cloud-Org-ID': this.cloudOrgId,
    };
  }

  /**
   * Формирует заголовки для авторизации через IAM в API Яндекс.Трекера
   * @returns Объект с заголовками авторизации
   */
  private async getTrackerIamHeadersAsync(): Promise<Record<string, string>> {
    await this.ensureValidIamToken();

    return {
      Authorization: `Bearer ${this.iamToken}`,
      Host: 'api.tracker.yandex.net',
      'X-Cloud-Org-ID': this.cloudOrgId,
    };
  }

  /**
   * Универсальный метод для получения заголовков авторизации
   * Автоматически выбирает между IAM и OAuth в зависимости от конфигурации
   * @returns Объект с заголовками авторизации
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    if (
      this.useIamAuth == false &&
      this.serviceAccountId &&
      this.serviceAccountIdKey &&
      this.serviceAccountPrivateKey
    ) {
      try {
        return await this.getTrackerIamHeadersAsync();
      } catch (error) {
        this.logger.warn('Failed to get IAM token, falling back to OAuth', { error: this.extractErrorDetails(error) });
        return this.getTrackerOAuthHeaders();
      }
    }

    return this.getTrackerOAuthHeaders();
  }

  /**
   * Проверяет, истек ли IAM токен
   * @returns true если токен истек или отсутствует
   */
  private isIamTokenExpired(): boolean {
    if (!this.iamToken || !this.iamTokenExpiry) {
      return true;
    }

    // Обновляем токен за 5 минут до истечения
    const fiveMinutesInSeconds = 5 * 60;
    return Date.now() / 1000 > this.iamTokenExpiry - fiveMinutesInSeconds;
  }

  /**
   * Обновляет IAM токен если необходимо
   * @returns Promise<void>
   */
  private async ensureValidIamToken(): Promise<void> {
    if (this.isIamTokenExpired()) {
      this.logger.debug('IAM token expired or missing, refreshing...');
      const result = await this.getIamToken();

      if (result.success && result.data) {
        this.iamToken = result.data.iamToken;
        // IAM токены живут 12 часов, но мы будем обновлять через 11 часов для безопасности
        this.iamTokenExpiry = Math.floor(Date.now() / 1000) + 11 * 60 * 60;
        this.logger.debug('IAM token refreshed successfully');
      } else {
        throw new Error('Failed to refresh IAM token');
      }
    }
  }

  /**
   * Формирует параметры для scroll-запроса с валидацией значений
   * @param options - Опции scroll-запроса
   * @param scrollId - ID для продолжения прокрутки (если есть)
   * @returns Объект с параметрами запроса
   */
  private buildScrollParams<TRequest>(options: IScrollOptions<TRequest>, scrollId?: string): Record<string, string> {
    const params: Record<string, string> = {};

    if (scrollId) {
      params.scrollId = scrollId;
    } else {
      params.scrollType = options.scrollType;

      const perScroll =
        options.perScroll !== undefined
          ? Math.min(Math.max(1, options.perScroll), PAGINATION_CONSTANTS.MAX_PER_SCROLL)
          : PAGINATION_CONSTANTS.DEFAULT_PER_SCROLL;

      params.perScroll = String(perScroll);
    }

    if (options.scrollTTLMillis !== undefined) {
      const ttl = Math.max(PAGINATION_CONSTANTS.MIN_SCROLL_TTL, options.scrollTTLMillis);
      params.scrollTTLMillis = String(ttl);
    } else {
      params.scrollTTLMillis = String(PAGINATION_CONSTANTS.DEFAULT_SCROLL_TTL);
    }

    return params;
  }

  /**
   * Извлекает метаданные scroll-запроса из заголовков ответа
   * @param headers - Заголовки HTTP-ответа
   * @returns Объект с scroll ID и общим количеством записей
   */
  private extractScrollHeaders(headers: unknown): { scrollId?: string; totalCount?: number } {
    const headersRecord = headers as Record<string, unknown> | undefined;
    return {
      scrollId: headersRecord ? this.getHeaderValue(headersRecord, 'x-scroll-id') : undefined,
      totalCount: headersRecord ? this.getNumericHeaderValue(headersRecord, 'x-total-count') : undefined,
    };
  }

  /**
   * Извлекает метаданные пагинации из заголовков ответа
   * @param headers - Заголовки HTTP-ответа
   * @returns Объект с общим количеством страниц и записей
   */
  private extractPaginationHeaders(headers: unknown): { totalPages?: number; totalCount?: number } {
    const headersRecord = headers as Record<string, unknown> | undefined;
    return {
      totalPages: headersRecord ? this.getNumericHeaderValue(headersRecord, 'x-total-pages') : undefined,
      totalCount: headersRecord ? this.getNumericHeaderValue(headersRecord, 'x-total-count') : undefined,
    };
  }

  /**
   * Безопасно извлекает строковое значение из заголовков
   * @param headers - Объект с заголовками
   * @param key - Ключ заголовка
   * @returns Строковое значение или undefined
   */
  private getHeaderValue(headers: Record<string, unknown>, key: string): string | undefined {
    const value = headers[key];
    return typeof value === 'string' ? value : undefined;
  }

  /**
   * Безопасно извлекает числовое значение из заголовков
   * @param headers - Объект с заголовками
   * @param key - Ключ заголовка
   * @returns Числовое значение или undefined
   */
  private getNumericHeaderValue(headers: Record<string, unknown>, key: string): number | undefined {
    const value = headers[key];
    if (typeof value === 'string' || typeof value === 'number') {
      const num = Number(value);
      return isNaN(num) ? undefined : num;
    }
    return undefined;
  }

  /**
   * Обрабатывает начало HTTP-запроса (хук логирования)
   * @param operation - Название операции
   * @param config - Конфигурация Axios-запроса
   */
  protected onRequestStart(operation: string, config: AxiosRequestConfig): void {
    this.logger.debug(`[${operation}] Yandex Tracker: ${config.method?.toUpperCase()} ${config.url}`, {
      headers: this.sanitizeHeaders(config.headers),
    });
  }

  /**
   * Обрабатывает успешное завершение HTTP-запроса (хук логирования)
   * @param operation - Название операции
   * @param config - Конфигурация Axios-запроса
   * @param response - HTTP-ответ
   */
  protected onRequestSuccess(operation: string, config: AxiosRequestConfig, response: AxiosResponse): void {
    this.logger.log(`[${operation}] Success`, {
      status: response.status,
      dataLength: Array.isArray(response.data) ? response.data.length : response.data ? 1 : 0,
    });
  }

  /**
   * Обрабатывает ошибку HTTP-запроса (хук логирования)
   * @param operation - Название операции
   * @param config - Конфигурация Axios-запроса
   * @param error - Объект ошибки
   * @param axiosError - Ошибка Axios
   */
  protected onRequestError(
    operation: string,
    config: AxiosRequestConfig,
    error: unknown,
    axiosError: AxiosError,
  ): void {
    this.logger.error(`[${operation}] Error`, {
      message: axiosError.message,
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
      url: config.url,
      method: config.method,
    });
  }

  /**
   * Очищает заголовки от конфиденциальной информации для безопасного логирования
   * @param headers - Заголовки HTTP-запроса
   * @returns Очищенные заголовки
   */
  private sanitizeHeaders(headers: unknown): Record<string, string> {
    const result: Record<string, string> = {};

    if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
      return result;
    }

    const headersObj = headers as Record<string, unknown>;

    for (const [key, value] of Object.entries(headersObj)) {
      if (key.toLowerCase() === 'authorization') {
        result[key] = '[HIDDEN]';
      } else if (typeof value === 'string') {
        result[key] = value;
      } else if (value === null || value === undefined) {
        result[key] = '';
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        result[key] = String(value);
      } else {
        result[key] = '[Object]';
      }
    }

    return result;
  }

  /**
   * Извлекает текстовое описание ошибки из объекта любого типа
   * @param error - Объект ошибки
   * @returns Текстовое описание ошибки
   */
  private extractErrorDetails(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'Unknown error';
  }
}
