import { IHttpRequestOptions } from '@src/shared/abstract/http-client/http-client.abstract.interface';

export interface IScrollMeta {
  scrollId?: string;
  totalCount?: number;
  isLast: boolean;
}

export interface IPaginateMeta {
  page: number;
  totalPages?: number;
  totalCount?: number;
  isLast: boolean;
}

export type ScrollType = 'sorted' | 'unsorted';

export interface IScrollOptions<TRequest> extends IHttpRequestOptions<TRequest> {
  scrollType: ScrollType;
  perScroll?: number;
  scrollTTLMillis?: number;
}

export interface IPaginateOptions<TRequest> extends IHttpRequestOptions<TRequest> {
  perPage?: number;
  pageStart?: number;
}
