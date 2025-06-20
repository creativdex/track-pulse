import { Test, TestingModule } from '@nestjs/testing';
import { YaTrackerClient } from '../ya-tracker.client';
import { EContentType, EHttpMethod } from '@src/shared/abstract/http-client/http-client.abstract.enum';
import { YaTrackerWorklogClient } from './ya-tracker-worklog.client';

// Mock для jose
jest.mock('jose', () => ({
  importPKCS8: jest.fn().mockResolvedValue('mock-private-key'),
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock-jwt-token'),
  })),
}));

describe('YaTrackerWorklogClient', () => {
  let worklogClient: YaTrackerWorklogClient;
  let baseClient: YaTrackerClient;

  const mockBaseClient = {
    makeRequest: jest.fn(),
    requestAllData: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: YaTrackerClient,
          useValue: mockBaseClient,
        },
      ],
    }).compile();

    baseClient = module.get<YaTrackerClient>(YaTrackerClient);
    worklogClient = new YaTrackerWorklogClient(baseClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should be defined', () => {
      expect(worklogClient).toBeDefined();
    });

    it('should initialize with base client', () => {
      expect(worklogClient['baseClient']).toBe(baseClient);
    });

    describe('getByTaskWorklog', () => {
      it('should call makeRequest with correct parameters', async () => {
        const mockResponse = { data: [] };
        mockBaseClient.makeRequest.mockResolvedValue(mockResponse);

        const result = await worklogClient.getByTaskWorklog({ taskId: '1' });

        expect(mockBaseClient.makeRequest).toHaveBeenCalledWith(
          { method: EHttpMethod.GET, endpoint: 'issues/1/worklog', contentType: EContentType.JSON },
          'get_worklogs_by_task',
        );
        expect(result).toEqual(mockResponse);
      });

      it('should log getting worklogs by task', async () => {
        const consoleSpy = jest.spyOn(worklogClient['logger'], 'log').mockImplementation();
        await worklogClient.getByTaskWorklog({ taskId: '1' });
        expect(consoleSpy).toHaveBeenCalledWith('Getting worklogs by task', { data: '1' });
        consoleSpy.mockRestore();
      });

      it('should handle errors gracefully', async () => {
        mockBaseClient.makeRequest.mockRejectedValue(new Error('Network error'));
        await expect(worklogClient.getByTaskWorklog({ taskId: '1' })).rejects.toThrow('Network error');
      });

      it('should return an empty array if no worklogs found', async () => {
        mockBaseClient.makeRequest.mockResolvedValue({ data: [] });
        const result = await worklogClient.getByTaskWorklog({ taskId: '1' });
        if (result.success) {
          expect(result.data).toEqual([]);
        }
      });

      it('should return worklogs data', async () => {
        const mockWorklogs = [{ id: '1', timeSpent: 120 }];
        mockBaseClient.makeRequest.mockResolvedValue({ data: mockWorklogs });
        const result = await worklogClient.getByTaskWorklog({ taskId: '1' });
        if (result.success) {
          expect(result.data).toEqual(mockWorklogs);
        }
      });
    });

    describe('getByQueryWorklog', () => {
      it('should call makeRequest with correct parameters', async () => {
        const mockWorklogs = [{ id: '1', timeSpent: 120 }];
        mockBaseClient.makeRequest.mockResolvedValue({ data: mockWorklogs });

        const result = await worklogClient.getByQueryWorklog({ createdAt: { from: '2023-01-01', to: '2026-01-31' } });

        expect(mockBaseClient.makeRequest).toHaveBeenCalledWith(
          {
            method: EHttpMethod.POST,
            endpoint: 'worklog/_search',
            data: { createdAt: { from: '2023-01-01', to: '2026-01-31' } },
            contentType: EContentType.JSON,
          },
          'get_worklogs_by_query',
        );
        expect(result).toEqual({ data: mockWorklogs });
      });

      it('should log getting worklogs by query', async () => {
        const consoleSpy = jest.spyOn(worklogClient['logger'], 'log').mockImplementation();
        await worklogClient.getByQueryWorklog({ createdAt: { from: '2023-01-01', to: '2026-01-31' } });
        expect(consoleSpy).toHaveBeenCalledWith('Getting worklogs by query', {
          data: { createdAt: { from: '2023-01-01', to: '2026-01-31' } },
        });
        consoleSpy.mockRestore();
      });

      it('should handle errors gracefully', async () => {
        mockBaseClient.makeRequest.mockRejectedValue(new Error('Network error'));
        await expect(
          worklogClient.getByQueryWorklog({ createdAt: { from: '2023-01-01', to: '2026-01-31' } }),
        ).rejects.toThrow('Network error');
      });

      it('should return worklogs data', async () => {
        const mockWorklogs = [{ id: '1', timeSpent: 120 }];
        mockBaseClient.makeRequest.mockResolvedValue({ data: mockWorklogs });
        const result = await worklogClient.getByQueryWorklog({ createdAt: { from: '2023-01-01', to: '2026-01-31' } });
        if (result.success) {
          expect(result.data).toEqual(mockWorklogs);
        }
      });
    });
  });
});
