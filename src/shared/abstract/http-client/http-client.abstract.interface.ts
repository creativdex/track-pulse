import { EContentType, EHttpMethod } from './http-client.abstract.enum';

export interface IHttpRequestOptions<TRequestBody = unknown> {
  method: EHttpMethod | string;
  endpoint: string;
  data?: TRequestBody;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  timeout?: number;
  contentType?: EContentType | string;
}
