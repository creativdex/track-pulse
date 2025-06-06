import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { YaTrackerClient } from './ya-tracker.client';
import { AxiosError } from 'axios';

describe('YaTrackerClient', () => {
  let client: YaTrackerClient;
  let mockConfigService: jest.Mocked<Pick<ConfigService, 'getOrThrow'>>;

  beforeEach(async () => {
    mockConfigService = {
      getOrThrow: jest.fn().mockImplementation((key: string) => {
        const config = {
          ENV__YA_TRACKER_API_URL: 'https://api.tracker.yandex.net/v2',
          ENV__YA_TRACKER_ORG_ID: 'test-org-id',
          SECRET__YA_TRACKER_OAUTH_TOKEN: 'test-oauth-token',
        };
        return config[key as keyof typeof config];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YaTrackerClient,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    client = module.get<YaTrackerClient>(YaTrackerClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should be defined', () => {
      expect(client).toBeDefined();
    });

    it('should initialize with correct config values', () => {
      expect(mockConfigService.getOrThrow).toHaveBeenCalledWith('ENV__YA_TRACKER_API_URL');
      expect(mockConfigService.getOrThrow).toHaveBeenCalledWith('ENV__YA_TRACKER_ORG_ID');
      expect(mockConfigService.getOrThrow).toHaveBeenCalledWith('SECRET__YA_TRACKER_OAUTH_TOKEN');
    });

    it('should have tasks client initialized', () => {
      expect(client.tasks).toBeDefined();
    });
  });

  describe('makeRequest', () => {
    it('should add tracker headers to request', async () => {
      // Мокаем sendRequest метод
      const sendRequestSpy = jest.spyOn(client as any, 'sendRequest').mockResolvedValue({
        success: true,
        data: { test: 'data' },
      });

      const options = {
        method: 'GET',
        endpoint: 'test',
      };

      await client.makeRequest(options, 'test_operation');

      expect(sendRequestSpy).toHaveBeenCalledWith(
        {
          ...options,
          headers: {
            Authorization: 'OAuth test-oauth-token',
            Host: 'api.tracker.yandex.net',
            'X-Cloud-Org-ID': 'test-org-id',
          },
        },
        'test_operation',
      );
    });

    it('should preserve existing headers', async () => {
      const sendRequestSpy = jest.spyOn(client as any, 'sendRequest').mockResolvedValue({
        success: true,
        data: { test: 'data' },
      });

      const options = {
        method: 'GET',
        endpoint: 'test',
        headers: {
          'Custom-Header': 'custom-value',
        },
      };

      await client.makeRequest(options, 'test_operation');

      expect(sendRequestSpy).toHaveBeenCalledWith(
        {
          ...options,
          headers: {
            Authorization: 'OAuth test-oauth-token',
            Host: 'api.tracker.yandex.net',
            'X-Cloud-Org-ID': 'test-org-id',
            'Custom-Header': 'custom-value',
          },
        },
        'test_operation',
      );
    });
  });

  describe('scrollRequest', () => {
    it('should handle single page scroll', async () => {
      const mockResponse = {
        data: [{ id: '1', key: 'TEST-1' }],
        headers: {
          'x-scroll-id': null, // Indicates last page
          'x-total-count': '1',
        },
      };

      jest.spyOn(client as any, 'sendRequestRawResult').mockResolvedValue(mockResponse);

      const onPageMock = jest.fn();
      const options = {
        method: 'POST',
        endpoint: 'issues/_search',
        scrollType: 'sorted' as const,
      };

      await client.scrollRequest(options, 'test_scroll', onPageMock);

      expect(onPageMock).toHaveBeenCalledTimes(1);
      expect(onPageMock).toHaveBeenCalledWith(mockResponse.data, {
        scrollId: undefined,
        totalCount: 1,
        isLast: true,
      });
    });

    it('should handle multiple pages scroll', async () => {
      const mockResponses = [
        {
          data: [{ id: '1', key: 'TEST-1' }],
          headers: {
            'x-scroll-id': 'scroll-id-1',
            'x-total-count': '2',
          },
        },
        {
          data: [{ id: '2', key: 'TEST-2' }],
          headers: {
            'x-scroll-id': null,
            'x-total-count': '2',
          },
        },
      ];

      jest
        .spyOn(client as any, 'sendRequestRawResult')
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1]);

      const onPageMock = jest.fn();
      const options = {
        method: 'POST',
        endpoint: 'issues/_search',
        scrollType: 'sorted' as const,
      };

      await client.scrollRequest(options, 'test_scroll', onPageMock);

      expect(onPageMock).toHaveBeenCalledTimes(2);
      expect(onPageMock).toHaveBeenNthCalledWith(1, mockResponses[0].data, {
        scrollId: 'scroll-id-1',
        totalCount: 2,
        isLast: false,
      });
      expect(onPageMock).toHaveBeenNthCalledWith(2, mockResponses[1].data, {
        scrollId: undefined,
        totalCount: 2,
        isLast: true,
      });
    });

    it('should handle scroll errors', async () => {
      const error = new AxiosError('Network error');
      jest.spyOn(client as any, 'sendRequestRawResult').mockRejectedValue(error);

      const onPageMock = jest.fn();
      const options = {
        method: 'POST',
        endpoint: 'issues/_search',
        scrollType: 'sorted' as const,
      };

      await expect(client.scrollRequest(options, 'test_scroll', onPageMock)).rejects.toThrow('Network error');
      expect(onPageMock).not.toHaveBeenCalled();
    });

    it('should prevent infinite loops', async () => {
      // Мокаем бесконечный scroll (всегда возвращает scroll-id)
      const mockResponse = {
        data: [{ id: '1', key: 'TEST-1' }],
        headers: {
          'x-scroll-id': 'never-ending-scroll',
          'x-total-count': '1000',
        },
      };

      jest.spyOn(client as any, 'sendRequestRawResult').mockResolvedValue(mockResponse);

      const onPageMock = jest.fn();
      const options = {
        method: 'POST',
        endpoint: 'issues/_search',
        scrollType: 'sorted' as const,
      };

      await expect(client.scrollRequest(options, 'test_scroll', onPageMock)).rejects.toThrow(
        'Max iterations (1000) exceeded in scroll request',
      );
    });
  });

  describe('paginateRequest', () => {
    it('should handle single page pagination', async () => {
      const mockResponse = {
        data: [{ id: '1', key: 'TEST-1' }],
        headers: {
          'x-total-pages': '1',
          'x-total-count': '1',
        },
      };

      jest.spyOn(client as any, 'sendRequestRawResult').mockResolvedValue(mockResponse);

      const onPageMock = jest.fn();
      const options = {
        method: 'POST',
        endpoint: 'issues/_search',
      };

      await client.paginateRequest(options, 'test_paginate', onPageMock);

      expect(onPageMock).toHaveBeenCalledTimes(1);
      expect(onPageMock).toHaveBeenCalledWith(mockResponse.data, {
        page: 1,
        totalPages: 1,
        totalCount: 1,
        isLast: true,
      });
    });

    it('should handle multiple pages pagination', async () => {
      const mockResponses = [
        {
          data: [{ id: '1', key: 'TEST-1' }],
          headers: {
            'x-total-pages': '2',
            'x-total-count': '2',
          },
        },
        {
          data: [{ id: '2', key: 'TEST-2' }],
          headers: {
            'x-total-pages': '2',
            'x-total-count': '2',
          },
        },
      ];

      jest
        .spyOn(client as any, 'sendRequestRawResult')
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1]);

      const onPageMock = jest.fn();
      const options = {
        method: 'POST',
        endpoint: 'issues/_search',
      };

      await client.paginateRequest(options, 'test_paginate', onPageMock);

      expect(onPageMock).toHaveBeenCalledTimes(2);
      expect(onPageMock).toHaveBeenNthCalledWith(1, mockResponses[0].data, {
        page: 1,
        totalPages: 2,
        totalCount: 2,
        isLast: false,
      });
      expect(onPageMock).toHaveBeenNthCalledWith(2, mockResponses[1].data, {
        page: 2,
        totalPages: 2,
        totalCount: 2,
        isLast: true,
      });
    });
  });

  describe('detectPaginationStrategies', () => {
    it('should detect both strategies when supported', async () => {
      const paginateResponse = {
        data: [],
        headers: { 'x-total-pages': '10' },
      };
      const scrollResponse = {
        data: [],
        headers: { 'x-scroll-id': 'test-scroll-id' },
      };

      jest
        .spyOn(client as any, 'sendRequestRawResult')
        .mockResolvedValueOnce(paginateResponse)
        .mockResolvedValueOnce(scrollResponse);

      const strategies = await client.detectPaginationStrategies(
        { method: 'POST', endpoint: 'test' },
        'test_detection',
      );

      expect(strategies).toEqual(['paginate', 'scroll']);
    });

    it('should detect only pagination when scroll fails', async () => {
      const paginateResponse = {
        data: [],
        headers: { 'x-total-pages': '10' },
      };

      jest
        .spyOn(client as any, 'sendRequestRawResult')
        .mockResolvedValueOnce(paginateResponse)
        .mockRejectedValueOnce(new Error('Scroll not supported'));

      const strategies = await client.detectPaginationStrategies(
        { method: 'POST', endpoint: 'test' },
        'test_detection',
      );

      expect(strategies).toEqual(['paginate']);
    });

    it('should return empty array when no strategies supported', async () => {
      jest
        .spyOn(client as any, 'sendRequestRawResult')
        .mockRejectedValueOnce(new Error('Pagination not supported'))
        .mockRejectedValueOnce(new Error('Scroll not supported'));

      const strategies = await client.detectPaginationStrategies(
        { method: 'POST', endpoint: 'test' },
        'test_detection',
      );

      expect(strategies).toEqual([]);
    });
  });
});
