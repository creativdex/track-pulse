/**
 * E2E tests for YaTrackerClient user methods.
 * Covers configuration, real API integration (if enabled), and mock API scenarios.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { YaTrackerClient } from '../src/shared/clients/ya-tracker/ya-tracker.client';
import { YaTrackerModule } from '../src/shared/clients/ya-tracker/ya-tracker.module';
import type { AxiosError } from 'axios';
import type { IClientResult } from '../src/shared/types/client-result.type';

describe('YaTracker E2E Tests - Worklog', () => {
  let app: NestFastifyApplication;
  let yaTrackerClient: YaTrackerClient;
  let configService: ConfigService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env'],
          expandVariables: true,
        }),
        YaTrackerModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();

    yaTrackerClient = moduleFixture.get<YaTrackerClient>(YaTrackerClient);
    configService = moduleFixture.get<ConfigService>(ConfigService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should load required environment variables', () => {
      const apiUrl = configService.get<string>('ENV__YA_TRACKER_API_URL');
      const orgId = configService.get<string>('ENV__YA_TRACKER_ORG_ID');
      const oauthToken = configService.get<string>('SECRET__YA_TRACKER_OAUTH_TOKEN');
      expect(apiUrl).toBeTruthy();
      expect(orgId).toBeTruthy();
      expect(oauthToken).toBeTruthy();
    });

    it('should initialize YaTrackerClient', () => {
      expect(yaTrackerClient).toBeDefined();
      expect(yaTrackerClient.worklog).toBeDefined();
    });
  });

  const isRealApiTest = process.env.ENABLE_REAL_API_TESTS === 'true';
  (isRealApiTest ? describe : describe.skip)('Real API Integration', () => {
    it('should get worklog by task', async () => {
      const taskId = 'DV-21';
      const result = await yaTrackerClient.worklog.getByTaskWorklog({
        taskId,
      });
      expect(result).toBeDefined();
      if (result.success) {
        expect(result.data).toBeInstanceOf(Array);
      }
    });

    it('should get worklog by user', async () => {
      const userId = '8000000000000024';
      const result = await yaTrackerClient.worklog.getByQueryWorklog({
        createdBy: userId,
      });
      expect(result).toBeDefined();
      if (result.success) {
        expect(result.data).toBeInstanceOf(Array);
      }
    });
  });

  describe('User Mock API', () => {
    it('should handle API errors', async () => {
      const axiosError: AxiosError = {
        isAxiosError: true,
        message: 'Network timeout',
        name: 'AxiosError',
        config: { headers: {} as import('axios').AxiosRequestHeaders },
        toJSON: () => ({}),
        response: undefined,
        code: undefined,
        request: undefined,
      };
      jest.spyOn(yaTrackerClient, 'makeRequest').mockResolvedValue({
        success: false,
        error: axiosError,
      });
      const result = await yaTrackerClient.worklog.getByQueryWorklog({
        createdBy: '8000000000000024',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error.isAxiosError).toBe(true);
      }
    });

    it('should call makeRequest with correct parameters', async () => {
      const mockResponse = {
        data: [
          {
            id: 'worklog1',
            issue: 'DV-21',
            comment: 'Worked on task DV-21',
          },
        ],
      };
      const mockMakeRequest = jest.spyOn(yaTrackerClient, 'makeRequest').mockResolvedValue({
        success: true,
        data: mockResponse.data,
      } as IClientResult<any>);
      const payload = {};
      const result = await yaTrackerClient.worklog.getByQueryWorklog(payload);
      expect(mockMakeRequest).toHaveBeenCalledWith(
        { method: 'POST', endpoint: 'worklog/_search', data: payload, contentType: 'application/json' },
        'get_worklogs_by_query',
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockResponse.data);
      }
    });

    it('should return empty array if no worklogs found', async () => {
      jest.spyOn(yaTrackerClient, 'makeRequest').mockResolvedValue({
        success: true,
        data: [],
      });
      const result = await yaTrackerClient.worklog.getByQueryWorklog({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBe(0);
      }
    });

    it('should handle invalid response structure', async () => {
      jest.spyOn(yaTrackerClient, 'makeRequest').mockResolvedValue({
        success: true,
        data: undefined,
      });
      const result = await yaTrackerClient.users.getUsers();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it('should support filtering worklogs by query', async () => {
      const mockWorklogs = [
        { id: 'worklog1', issue: 'DV-21', comment: 'Worked on task DV-21' },
        { id: 'worklog2', issue: 'DV-22', comment: 'Worked on task DV-22' },
      ];
      const mockMakeRequest = jest.spyOn(yaTrackerClient, 'makeRequest').mockResolvedValue({
        success: true,
        data: mockWorklogs,
      } as IClientResult<any>);
      const payload = { createdBy: '8000000000000024' };
      const result = await yaTrackerClient.worklog.getByQueryWorklog(payload);
      expect(mockMakeRequest).toHaveBeenCalledWith(
        { method: 'POST', endpoint: 'worklog/_search', data: payload, contentType: 'application/json' },
        'get_worklogs_by_query',
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockWorklogs);
      }
    });
  });
});
