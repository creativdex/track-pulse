/**
 * E2E tests for YaTrackerClient task methods.
 * Covers configuration, real API integration (if enabled), and mock API scenarios.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { YaTrackerClient } from '../src/shared/clients/ya-tracker/ya-tracker.client';
import { YaTrackerModule } from '../src/shared/clients/ya-tracker/ya-tracker.module';
import type { AxiosError } from 'axios';
import type { IClientResult } from '../src/shared/types/client-result.type';

describe('YaTracker E2E Tests - Task', () => {
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
      expect(yaTrackerClient.tasks).toBeDefined();
      expect(yaTrackerClient.users).toBeDefined();
    });
  });

  const isRealApiTest = process.env.ENABLE_REAL_API_TESTS === 'true';
  (isRealApiTest ? describe : describe.skip)('Real API Integration', () => {
    it('should detect pagination strategies', async () => {
      const strategies = await yaTrackerClient.detectPaginationStrategies(
        {
          method: 'POST',
          endpoint: 'issues/_search',
          data: { filter: { queue: configService.get<string>('ENV__YA_TRACKER_QUEUE') } },
        },
        'test_strategy_detection',
      );
      expect(Array.isArray(strategies)).toBe(true);
    });

    it('should search tasks by queue', async () => {
      const testQueue = configService.get<string>('ENV__YA_TRACKER_QUEUE');
      if (!testQueue) return;

      let pageCount = 0;

      await yaTrackerClient.tasks.searchTasksByQueue(testQueue, { strategy: 'paginate' }, (tasks, meta) => {
        pageCount++;
        if (tasks.length > 0) {
          const firstTask = tasks[0];
          expect(firstTask).toHaveProperty('id');
          expect(firstTask).toHaveProperty('key');
          expect(firstTask).toHaveProperty('summary');
          expect(firstTask).toHaveProperty('queue');
          expect(firstTask.queue.key).toBe(testQueue);
        }
        expect(meta).toHaveProperty('isLast');
        expect(typeof meta.isLast).toBe('boolean');
      });
      expect(pageCount).toBeGreaterThanOrEqual(1);
    });

    it('should handle non-existent task', async () => {
      const result = await yaTrackerClient.tasks.getTask('NONEXISTENT-999999');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('should respect pagination limits', async () => {
      const testQueue = configService.get<string>('ENV__YA_TRACKER_QUEUE');
      if (!testQueue) return;

      let maxPageSize = 0;

      await yaTrackerClient.tasks.searchTasksByQueue(testQueue, { strategy: 'paginate', perPage: 5 }, (tasks) => {
        maxPageSize = Math.max(maxPageSize, tasks.length);
        expect(tasks.length).toBeLessThanOrEqual(5);
      });
      expect(maxPageSize).toBeLessThanOrEqual(5);
    });
  });

  describe('Mock API Tests', () => {
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

      const result = await yaTrackerClient.tasks.getTask('TEST-1');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error.isAxiosError).toBe(true);
      }
    });

    it('should validate request parameters', async () => {
      const mockTask = {
        id: 'test-id',
        key: 'TEST-1',
        summary: 'Test task',
      };
      const mockMakeRequest = jest.spyOn(yaTrackerClient, 'makeRequest').mockResolvedValue({
        success: true,
        data: mockTask,
      } as IClientResult<Record<string, unknown>>);

      await yaTrackerClient.tasks.createTask({
        summary: 'Test Task',
        queue: 'TEST',
        description: 'Test description',
      });

      const callArgs = mockMakeRequest.mock.calls[0][0];
      expect(callArgs.data).toMatchObject({
        summary: 'Test Task',
        queue: 'TEST',
        description: 'Test description',
      });
    });
  });
});
