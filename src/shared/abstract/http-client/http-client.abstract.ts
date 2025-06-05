import { HttpService } from '@nestjs/axios';
import { firstValueFrom, Observable } from 'rxjs';
import { IClientResult } from '@src/shared/types/client-result.type';
import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { IHttpRequestOptions } from './http-client.abstract.interface';

export abstract class AbstractHttpClient {
  protected readonly httpService: HttpService;
  protected readonly defaultTimeout: number = 15000;

  protected constructor(protected readonly baseUrl: string) {
    this.httpService = new HttpService();
  }

  /**
   * Отправляет HTTP-запрос и возвращает результат.
   * @param options - Параметры запроса, включая метод, конечную точку, данные, параметры и заголовки.
   * @param operation - Описание операции для логирования.
   * @returns Promise с результатом запроса.
   */
  protected async sendRequest<TResponseBody, TRequestBody = unknown>(
    options: IHttpRequestOptions<TRequestBody>,
    operation: string,
  ): Promise<IClientResult<TResponseBody>> {
    const fullUrl = `${this.baseUrl.replace(/\/$/, '')}/${options.endpoint.replace(/^\//, '')}`;
    const headers: Record<string, string> = { ...options.headers };

    if (options.contentType && !headers['Content-Type']) {
      headers['Content-Type'] = options.contentType;
    }

    const config: AxiosRequestConfig<TRequestBody> = {
      method: options.method,
      url: fullUrl,
      data: options.data,
      params: options.params,
      headers,
      timeout: options.timeout ?? this.defaultTimeout,
    };

    this.onRequestStart?.(operation, config);
    try {
      const requestObservable: Observable<AxiosResponse<TResponseBody>> =
        this.httpService.request<TResponseBody>(config);
      const response = await firstValueFrom(requestObservable);

      this.onRequestSuccess?.(operation, config, response);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const axiosError = this.toAxiosError(error);
      this.onRequestError?.(operation, config, error, axiosError);
      return { success: false, error: axiosError };
    }
  }

  /**
   * Отправляет HTTP-запрос и возвращает полный ответ с заголовками.
   * @param options - Параметры запроса, включая метод, конечную точку, данные, параметры и заголовки.
   * @param operation - Описание операции для логирования.
   * @returns Promise с полным ответом Axios.
   */
  protected async sendRequestRawResult<TResponseBody, TRequestBody = unknown>(
    options: IHttpRequestOptions<TRequestBody>,
    operation: string,
  ): Promise<AxiosResponse<TResponseBody>> {
    const fullUrl = `${this.baseUrl.replace(/\/$/, '')}/${options.endpoint.replace(/^\//, '')}`;
    const headers: Record<string, string> = { ...options.headers };

    if (options.contentType && !headers['Content-Type']) {
      headers['Content-Type'] = options.contentType;
    }

    const config: AxiosRequestConfig<TRequestBody> = {
      method: options.method,
      url: fullUrl,
      data: options.data,
      params: options.params,
      headers,
      timeout: options.timeout ?? this.defaultTimeout,
    };

    this.onRequestStart?.(operation, config);
    try {
      const requestObservable: Observable<AxiosResponse<TResponseBody>> =
        this.httpService.request<TResponseBody>(config);
      const response = await firstValueFrom(requestObservable);

      this.onRequestSuccess?.(operation, config, response);
      return response;
    } catch (error: unknown) {
      const axiosError = this.toAxiosError(error);
      this.onRequestError?.(operation, config, error, axiosError);
      throw axiosError;
    }
  }

  /**
   * Преобразует любую ошибку в AxiosError
   */
  private toAxiosError(error: unknown): AxiosError {
    if (error instanceof AxiosError) {
      return error;
    }

    // Создаем AxiosError для других типов ошибок
    const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return new AxiosError(message, 'UNKNOWN_ERROR');
  }

  /**
   * Вызывается перед началом запроса.
   * @param operation - Описание операции.
   * @param config - Конфигурация запроса.
   */
  protected onRequestStart?(operation: string, config: AxiosRequestConfig): void;

  /**
   * Вызывается при успешном завершении запроса.
   * @param operation - Описание операции.
   * @param config - Конфигурация запроса.
   * @param response - Ответ сервера.
   */
  protected onRequestSuccess?(operation: string, config: AxiosRequestConfig, response: AxiosResponse): void;

  /**
   * Вызывается при ошибке запроса.
   * @param operation - Описание операции.
   * @param config - Конфигурация запроса.
   * @param error - Ошибка запроса.
   * @param axiosError - AxiosError, представляющий ошибку.
   */
  protected onRequestError?(
    operation: string,
    config: AxiosRequestConfig,
    error: unknown,
    axiosError: AxiosError,
  ): void;
}
