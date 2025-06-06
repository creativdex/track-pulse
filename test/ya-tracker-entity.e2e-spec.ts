/**
 * E2E tests for YaTrackerClient entity methods.
 * Covers configuration, real API integration (if enabled), and mock API scenarios.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { YaTrackerClient } from '../src/shared/clients/ya-tracker/ya-tracker.client';
import { YaTrackerModule } from '../src/shared/clients/ya-tracker/ya-tracker.module';
import { ETrackerEntityType } from '../src/shared/clients/ya-tracker/entity/entity.enum';
import type { AxiosError } from 'axios';
import type { IClientResult } from '../src/shared/types/client-result.type';

describe('YaTracker E2E Tests - Entity', () => {
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
      expect(yaTrackerClient.entity).toBeDefined();
    });
  });

  const isRealApiTest = process.env.ENABLE_REAL_API_TESTS === 'true';
  (isRealApiTest ? describe : describe.skip)('Real API Integration', () => {
    it('should get entity by type and id', async () => {
      // Для реального теста нужны валидные значения
      const entityType = ETrackerEntityType.PROJECT;
      const entityId = process.env.TEST_ENTITY_ID || 'test-entity-id';
      const result = await yaTrackerClient.entity.getEntity({
        path: { typeEntity: entityType, id: entityId },
        query: { fields: 'id' },
      });
      expect(result).toBeDefined();
      // Проверка структуры ответа
      if (result.success) {
        expect(result.data).toHaveProperty('id');
      }
    });

    it('should search entities by type and parameters', async () => {
      const entityType = ETrackerEntityType.PROJECT;
      const result = await yaTrackerClient.entity.searchEntity({
        path: { typeEntity: entityType },
      });
      expect(result).toBeDefined();
      // Проверка структуры ответа
      if (result.success) {
        expect(result.data).toHaveProperty('hits');
        expect(result.data).toHaveProperty('pages');
        expect(result.data).toHaveProperty('values');
      }
    });
  });

  describe('Entity Mock API', () => {
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
      const result = await yaTrackerClient.entity.getEntity({
        path: { typeEntity: ETrackerEntityType.PROJECT, id: '123' },
        query: { fields: 'id' },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error.isAxiosError).toBe(true);
      }
    });

    it('should call makeRequest with correct parameters', async () => {
      const mockResponse = { id: '123' };
      const mockMakeRequest = jest.spyOn(yaTrackerClient, 'makeRequest').mockResolvedValue({
        success: true,
        data: mockResponse,
      } as IClientResult<any>);
      const result = await yaTrackerClient.entity.getEntity({
        path: { typeEntity: ETrackerEntityType.PROJECT, id: '123' },
        query: { fields: 'id' },
      });
      expect(mockMakeRequest).toHaveBeenCalledWith(
        { method: 'GET', endpoint: 'entities/project/123', params: { fields: 'id' }, contentType: 'application/json' },
        'get_entity',
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockResponse);
      }
    });

    it('should handle invalid response structure', async () => {
      jest.spyOn(yaTrackerClient, 'makeRequest').mockResolvedValue({
        success: true,
        data: undefined,
      });
      const result = await yaTrackerClient.entity.getEntity({
        path: { typeEntity: ETrackerEntityType.PROJECT, id: '123' },
        query: { fields: 'id' },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it('should search entities', async () => {
      const mockEntities = { hits: 1, pages: 1, values: [{ id: '1' }] };
      const mockMakeRequest = jest.spyOn(yaTrackerClient, 'makeRequest').mockResolvedValue({
        success: true,
        data: mockEntities,
      } as IClientResult<any>);
      const result = await yaTrackerClient.entity.searchEntity({
        path: { typeEntity: ETrackerEntityType.PROJECT },
        query: { fields: 'id' },
        body: { filter: { name: 'Test' } },
      });
      expect(mockMakeRequest).toHaveBeenCalledWith(
        {
          method: 'POST',
          endpoint: 'entities/project/_search',
          params: { fields: 'id' },
          data: { filter: { name: 'Test' } },
          contentType: 'application/json',
        },
        'search_entity',
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockEntities);
      }
    });
  });
});
