import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { YaTrackerModule } from './ya-tracker.module';
import { YaTrackerClient } from './ya-tracker.client';

describe('YaTrackerModule', () => {
  let module: TestingModule;
  let yaTrackerClient: YaTrackerClient;

  const mockConfigService = {
    getOrThrow: jest.fn(),
  };

  beforeEach(async () => {
    mockConfigService.getOrThrow.mockImplementation((key: string) => {
      const config = {
        ENV__YA_TRACKER_API_URL: 'https://api.tracker.yandex.net/v2',
        ENV__YA_TRACKER_ORG_ID: 'test-org-id',
        SECRET__YA_TRACKER_OAUTH_TOKEN: 'test-oauth-token',
      };
      return config[key as keyof typeof config];
    });

    module = await Test.createTestingModule({
      imports: [YaTrackerModule],
    })
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .compile();

    yaTrackerClient = module.get<YaTrackerClient>(YaTrackerClient);
  });

  afterEach(async () => {
    await module.close();
    jest.clearAllMocks();
  });

  describe('Module compilation', () => {
    it('should compile the module', () => {
      expect(module).toBeDefined();
    });

    it('should provide YaTrackerClient', () => {
      expect(yaTrackerClient).toBeDefined();
      expect(yaTrackerClient).toBeInstanceOf(YaTrackerClient);
    });

    it('should export YaTrackerClient', () => {
      const exportedClient = module.get<YaTrackerClient>(YaTrackerClient);
      expect(exportedClient).toBe(yaTrackerClient);
    });
  });

  describe('Dependencies', () => {
    it('should inject ConfigService', () => {
      expect(mockConfigService.getOrThrow).toHaveBeenCalledWith('ENV__YA_TRACKER_API_URL');
      expect(mockConfigService.getOrThrow).toHaveBeenCalledWith('ENV__YA_TRACKER_ORG_ID');
      expect(mockConfigService.getOrThrow).toHaveBeenCalledWith('SECRET__YA_TRACKER_OAUTH_TOKEN');
    });
  });

  describe('Integration', () => {
    it('should initialize client with tasks sub-client', () => {
      expect(yaTrackerClient.tasks).toBeDefined();
    });
  });
});
