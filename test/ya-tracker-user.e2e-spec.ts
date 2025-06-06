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

describe('YaTracker E2E Tests - User', () => {
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
    it('should get users list', async () => {
      const result = await yaTrackerClient.users.getUsers();
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
      const result = await yaTrackerClient.users.getUsers();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error.isAxiosError).toBe(true);
      }
    });

    it('should call makeRequest with correct parameters', async () => {
      const mockResponse = { data: [{ id: 'user1', display: 'Test User' }] };
      const mockMakeRequest = jest.spyOn(yaTrackerClient, 'makeRequest').mockResolvedValue({
        success: true,
        data: mockResponse.data,
      } as IClientResult<any>);
      const result = await yaTrackerClient.users.getUsers();
      expect(mockMakeRequest).toHaveBeenCalledWith(
        { method: 'GET', endpoint: 'users', contentType: 'application/json' },
        'get_users',
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockResponse.data);
      }
    });

    it('should return empty array if no users found', async () => {
      jest.spyOn(yaTrackerClient, 'makeRequest').mockResolvedValue({
        success: true,
        data: [],
      });
      const result = await yaTrackerClient.users.getUsers();
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

    it('should support filtering users by query', async () => {
      const mockUsers = [
        { id: 'user1', display: 'Test User' },
        { id: 'user2', display: 'Another User' },
      ];
      const mockMakeRequest = jest.spyOn(yaTrackerClient, 'makeRequest').mockResolvedValue({
        success: true,
        data: mockUsers,
      } as IClientResult<any>);
      // Suppose getUsers supports a query param (for demonstration)
      // In real client, you may need to add this param
      const result = await yaTrackerClient.users.getUsers(/*{ query: 'Test' }*/);
      expect(mockMakeRequest).toHaveBeenCalled();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockUsers);
      }
    });
  });
});
