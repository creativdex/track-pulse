import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { YaTrackerClient } from '../src/shared/clients/ya-tracker/ya-tracker.client';
import { YaTrackerModule } from '../src/shared/clients/ya-tracker/ya-tracker.module';

describe('YaTracker E2E Tests', () => {
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
    it('должен загружать необходимые переменные окружения', () => {
      const apiUrl = configService.get<string>('ENV__YA_TRACKER_API_URL');
      const orgId = configService.get<string>('ENV__YA_TRACKER_ORG_ID');
      const oauthToken = configService.get<string>('SECRET__YA_TRACKER_OAUTH_TOKEN');

      expect(apiUrl).toBeTruthy();
      expect(orgId).toBeTruthy();
      expect(oauthToken).toBeTruthy();
    });

    it('должен инициализировать YaTrackerClient', () => {
      expect(yaTrackerClient).toBeDefined();
      expect(yaTrackerClient.tasks).toBeDefined();
      expect(yaTrackerClient.users).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    it('должен выполнять простые запросы быстро', async () => {
      const start = Date.now();
      jest.spyOn(yaTrackerClient, 'makeRequest').mockResolvedValue({
        success: true,
        data: { id: 'test' } as any,
      });

      await yaTrackerClient.tasks.getTask('TEST-1');
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000);
    });

    it('должен обрабатывать конкурентные запросы', async () => {
      jest.spyOn(yaTrackerClient, 'makeRequest').mockResolvedValue({
        success: true,
        data: { id: 'test' } as any,
      });

      const promises = Array.from({ length: 5 }, (_, i) => yaTrackerClient.tasks.getTask(`TEST-${i + 1}`));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });
});
