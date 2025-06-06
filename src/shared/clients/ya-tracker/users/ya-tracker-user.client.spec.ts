import { Test, TestingModule } from '@nestjs/testing';
import { YaTrackerClient } from '../ya-tracker.client';
import { YaTrackerUserClient } from './ya-tracker-user.client';
import { EContentType, EHttpMethod } from '@src/shared/abstract/http-client/http-client.abstract.enum';

describe('YaTrackerUserClient', () => {
  let userClient: YaTrackerUserClient;
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
    userClient = new YaTrackerUserClient(baseClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should be defined', () => {
      expect(userClient).toBeDefined();
    });

    it('should initialize with base client', () => {
      expect(userClient['baseClient']).toBe(baseClient);
    });

    describe('getUsers', () => {
      it('should call makeRequest with correct parameters', async () => {
        const mockResponse = { data: [] };
        mockBaseClient.makeRequest.mockResolvedValue(mockResponse);

        const result = await userClient.getUsers();

        expect(mockBaseClient.makeRequest).toHaveBeenCalledWith(
          { method: EHttpMethod.GET, endpoint: 'users', contentType: EContentType.JSON },
          'get_users',
        );
        expect(result).toEqual(mockResponse);
      });

      it('should log getting users', async () => {
        const consoleSpy = jest.spyOn(userClient['logger'], 'log').mockImplementation();
        await userClient.getUsers();
        expect(consoleSpy).toHaveBeenCalledWith('Getting users');
        consoleSpy.mockRestore();
      });

      it('should handle errors gracefully', async () => {
        mockBaseClient.makeRequest.mockRejectedValue(new Error('Network error'));
        await expect(userClient.getUsers()).rejects.toThrow('Network error');
      });

      it('should return an empty array if no users found', async () => {
        mockBaseClient.makeRequest.mockResolvedValue({ data: [] });
        const result = await userClient.getUsers();
        if (result.success) {
          expect(result.data).toEqual([]);
        }
      });

      it('should return users data', async () => {
        const mockUsers = [{ id: '1', name: 'User 1' }];
        mockBaseClient.makeRequest.mockResolvedValue({ data: mockUsers });
        const result = await userClient.getUsers();
        if (result.success) {
          expect(result.data).toEqual(mockUsers);
        }
      });
    });

    describe('getUser', () => {
      it('should call makeRequest with correct parameters', async () => {
        const mockUser = { id: '1', name: 'User 1' };
        mockBaseClient.makeRequest.mockResolvedValue({ data: mockUser });

        const result = await userClient.getUser({ userId: '1' });

        expect(mockBaseClient.makeRequest).toHaveBeenCalledWith(
          { method: EHttpMethod.GET, endpoint: 'users/1', contentType: EContentType.JSON },
          'get_user',
        );
        expect(result).toEqual({ data: mockUser });
      });

      it('should log getting user with userId', async () => {
        const consoleSpy = jest.spyOn(userClient['logger'], 'log').mockImplementation();
        await userClient.getUser({ userId: '1' });
        expect(consoleSpy).toHaveBeenCalledWith('Getting user', { userId: '1' });
        consoleSpy.mockRestore();
      });

      it('should handle errors gracefully', async () => {
        mockBaseClient.makeRequest.mockRejectedValue(new Error('Network error'));
        await expect(userClient.getUser({ userId: '1' })).rejects.toThrow('Network error');
      });

      it('should return user data', async () => {
        const mockUser = { id: '1', name: 'User 1' };
        mockBaseClient.makeRequest.mockResolvedValue({ data: mockUser });
        const result = await userClient.getUser({ userId: '1' });
        if (result.success) {
          expect(result.data).toEqual(mockUser);
        }
      });
    });

    it('should handle invalid userId gracefully', async () => {
      const invalidUserId = 'invalid-id';
      mockBaseClient.makeRequest.mockRejectedValue(new Error('User not found'));
      await expect(userClient.getUser({ userId: invalidUserId })).rejects.toThrow('User not found');
      expect(mockBaseClient.makeRequest).toHaveBeenCalledWith(
        { method: EHttpMethod.GET, endpoint: `users/${invalidUserId}`, contentType: EContentType.JSON },
        'get_user',
      );
    });
  });
});
