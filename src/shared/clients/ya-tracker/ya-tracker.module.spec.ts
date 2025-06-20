import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { YaTrackerModule } from './ya-tracker.module';
import { YaTrackerClient } from './ya-tracker.client';

// Mock для jose
jest.mock('jose', () => ({
  importPKCS8: jest.fn().mockResolvedValue('mock-private-key'),
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock-jwt-token'),
  })),
}));

describe('YaTrackerModule', () => {
  let module: TestingModule;
  let yaTrackerClient: YaTrackerClient;

  const mockConfigService = {
    getOrThrow: jest.fn(),
    get: jest.fn(),
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

    mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        ENV__YA_TRACKER_USE_IAM: false,
        ENV__YA_TRACKER_SERVICE_ACC_ID: '',
        SECRET__YA_TRACKER_ID_KEY: '',
        SECRET__YA_TRACKER_PRIVATE_KEY: '',
      };
      return config[key as keyof typeof config] ?? defaultValue;
    });

    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), YaTrackerModule],
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
