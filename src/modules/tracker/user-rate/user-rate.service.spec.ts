import { Test, TestingModule } from '@nestjs/testing';
import { UserTrackerRateService } from './user-rate.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserTrackerRateEntity } from './user-rate.entity';
import { UserTrackerEntity } from '../user/user.entity';
import { EUserTrackerRateType } from './models/user-rate.model';

const mockUserRepository = () => ({
  findOne: jest.fn(),
});

const mockUserRateRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  manager: {
    transaction: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  },
});

describe('UserTrackerRateService', () => {
  let service: UserTrackerRateService;
  let userRepository: ReturnType<typeof mockUserRepository>;
  let userRateRepository: ReturnType<typeof mockUserRateRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserTrackerRateService,
        { provide: getRepositoryToken(UserTrackerRateEntity), useFactory: mockUserRateRepository },
        { provide: getRepositoryToken(UserTrackerEntity), useFactory: mockUserRepository },
      ],
    }).compile();

    service = module.get<UserTrackerRateService>(UserTrackerRateService);
    userRepository = module.get(getRepositoryToken(UserTrackerEntity));
    userRateRepository = module.get(getRepositoryToken(UserTrackerRateEntity));
  });

  it('should return error if user not found', async () => {
    type MockManager = {
      findOne: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
      save: jest.Mock;
    };

    const mockManager: MockManager = {
      findOne: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    userRateRepository.manager.transaction.mockImplementation(
      (callback: (manager: MockManager) => Promise<unknown>) => {
        return callback(mockManager);
      },
    );

    userRepository.findOne.mockResolvedValue(null);

    const result = await service.create({
      userId: '1',
      rate: 5,
      type: EUserTrackerRateType.GLOBAL,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/not found/);
    }
  });

  it('should create and save user rate if user exists', async () => {
    const user = { id: '1' };
    const userRate = {
      id: '2',
      userId: '1',
      rate: 5,
      type: EUserTrackerRateType.GLOBAL,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    type MockManager = {
      findOne: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
      save: jest.Mock;
    };

    const mockManager: MockManager = {
      findOne: jest.fn().mockResolvedValue(null), // No existing rate
      update: jest.fn(),
      create: jest.fn().mockReturnValue(userRate),
      save: jest.fn().mockResolvedValue(userRate),
    };

    userRateRepository.manager.transaction.mockImplementation(
      (callback: (manager: MockManager) => Promise<unknown>) => {
        return callback(mockManager);
      },
    );

    userRepository.findOne.mockResolvedValue(user);

    const createData = {
      userId: '1',
      rate: 5,
      type: EUserTrackerRateType.GLOBAL,
    };

    const result = await service.create(createData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(userRate);
    }

    expect(mockManager.findOne).toHaveBeenCalledWith(UserTrackerRateEntity, {
      where: {
        userId: '1',
        type: EUserTrackerRateType.GLOBAL,
        isActive: true,
      },
    });
    expect(mockManager.create).toHaveBeenCalledWith(UserTrackerRateEntity, {
      ...createData,
      isActive: true,
    });
    expect(mockManager.save).toHaveBeenCalledWith(userRate);
  });

  it('should deactivate existing rate before creating new one', async () => {
    const user = { id: '1' };
    const existingRate = {
      id: 'existing-rate-id',
      userId: '1',
      type: EUserTrackerRateType.PROJECT,
      contextValue: 'PROJECT123',
      isActive: true,
    };
    const newUserRate = {
      id: '2',
      userId: '1',
      rate: 1500,
      type: EUserTrackerRateType.PROJECT,
      contextValue: 'PROJECT123',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    type MockManager = {
      findOne: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
      save: jest.Mock;
    };

    const mockManager: MockManager = {
      findOne: jest.fn().mockResolvedValue(existingRate),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      create: jest.fn().mockReturnValue(newUserRate),
      save: jest.fn().mockResolvedValue(newUserRate),
    };

    userRateRepository.manager.transaction.mockImplementation(
      (callback: (manager: MockManager) => Promise<unknown>) => {
        return callback(mockManager);
      },
    );

    userRepository.findOne.mockResolvedValue(user);

    const createData = {
      userId: '1',
      rate: 1500,
      type: EUserTrackerRateType.PROJECT,
      contextValue: 'PROJECT123',
    };

    const result = await service.create(createData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(newUserRate);
    }

    // Verify existing rate was found and deactivated
    expect(mockManager.findOne).toHaveBeenCalledWith(UserTrackerRateEntity, {
      where: {
        userId: '1',
        type: EUserTrackerRateType.PROJECT,
        contextValue: 'PROJECT123',
        isActive: true,
      },
    });
    expect(mockManager.update).toHaveBeenCalledWith(
      UserTrackerRateEntity,
      { id: 'existing-rate-id' },
      { isActive: false },
    );

    // Verify new rate was created
    expect(mockManager.create).toHaveBeenCalledWith(UserTrackerRateEntity, {
      ...createData,
      isActive: true,
    });
    expect(mockManager.save).toHaveBeenCalledWith(newUserRate);
  });

  describe('batchUpdateRates', () => {
    it('should successfully update rates for multiple users', async () => {
      type MockManager = {
        findOne: jest.Mock;
        update: jest.Mock;
        create: jest.Mock;
        save: jest.Mock;
      };

      const mockManager: MockManager = {
        findOne: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      };

      userRateRepository.manager.transaction.mockImplementation((callback) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        callback(mockManager),
      );

      const user1 = { id: 'user1' };
      const user2 = { id: 'user2' };
      const existingRate = { id: 'existing-rate-id' };
      const newRate1 = { id: 'new-rate-1', rate: 1500 };
      const newRate2 = { id: 'new-rate-2', rate: 2000 };

      // Mock user lookups
      userRepository.findOne
        .mockResolvedValueOnce(user1) // First user lookup
        .mockResolvedValueOnce(user2); // Second user lookup

      // Mock existing rate lookups
      mockManager.findOne
        .mockResolvedValueOnce(existingRate) // User1 has existing rate
        .mockResolvedValueOnce(null); // User2 has no existing rate

      // Mock rate creation
      mockManager.create.mockReturnValueOnce(newRate1).mockReturnValueOnce(newRate2);

      // Mock rate saving
      mockManager.save.mockResolvedValueOnce(newRate1).mockResolvedValueOnce(newRate2);

      const batchData = {
        changes: [
          {
            userId: 'user1',
            rate: 1500,
            comment: 'Updated rate',
            type: EUserTrackerRateType.PROJECT,
            contextValue: 'PROJ123',
          },
          {
            userId: 'user2',
            rate: 2000,
            comment: 'New rate',
            type: EUserTrackerRateType.GLOBAL,
          },
        ],
      };

      const result = await service.batchUpdateRates(batchData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0]).toEqual({
          userId: 'user1',
          success: true,
          rateId: 'new-rate-1',
        });
        expect(result.data[1]).toEqual({
          userId: 'user2',
          success: true,
          rateId: 'new-rate-2',
        });
      }

      // Verify existing rate was deactivated for user1
      expect(mockManager.update).toHaveBeenCalledWith(
        UserTrackerRateEntity,
        { id: 'existing-rate-id' },
        { isActive: false },
      );

      // Verify new rates were created
      expect(mockManager.create).toHaveBeenCalledTimes(2);
      expect(mockManager.save).toHaveBeenCalledTimes(2);
    });

    it('should handle user not found error', async () => {
      type MockManager = {
        findOne: jest.Mock;
        update: jest.Mock;
        create: jest.Mock;
        save: jest.Mock;
      };

      const mockManager: MockManager = {
        findOne: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
      userRateRepository.manager.transaction.mockImplementation((callback) => callback(mockManager));

      // Mock user not found
      userRepository.findOne.mockResolvedValue(null);

      const batchData = {
        changes: [
          {
            userId: 'nonexistent-user',
            rate: 1500,
            comment: 'Test rate',
            type: EUserTrackerRateType.GLOBAL,
          },
        ],
      };

      const result = await service.batchUpdateRates(batchData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toEqual({
          userId: 'nonexistent-user',
          success: false,
          error: 'User with id nonexistent-user not found',
        });
      }

      // Verify no rate operations were performed
      expect(mockManager.create).not.toHaveBeenCalled();
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      type MockManager = {
        findOne: jest.Mock;
        update: jest.Mock;
        create: jest.Mock;
        save: jest.Mock;
      };

      const mockManager: MockManager = {
        findOne: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
      userRateRepository.manager.transaction.mockImplementation((callback) => callback(mockManager));

      const user = { id: 'user1' };
      userRepository.findOne.mockResolvedValue(user);
      mockManager.findOne.mockResolvedValue(null);
      mockManager.create.mockReturnValue({ id: 'new-rate' });

      // Mock database error on save
      mockManager.save.mockRejectedValue(new Error('Database connection error'));

      const batchData = {
        changes: [
          {
            userId: 'user1',
            rate: 1500,
            comment: 'Test rate',
            type: EUserTrackerRateType.GLOBAL,
          },
        ],
      };

      const result = await service.batchUpdateRates(batchData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toEqual({
          userId: 'user1',
          success: false,
          error: 'Database connection error',
        });
      }
    });

    it('should handle mixed success and failure results', async () => {
      type MockManager = {
        findOne: jest.Mock;
        update: jest.Mock;
        create: jest.Mock;
        save: jest.Mock;
      };

      const mockManager: MockManager = {
        findOne: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
      userRateRepository.manager.transaction.mockImplementation((callback) => callback(mockManager));

      const user1 = { id: 'user1' };
      const newRate = { id: 'new-rate-1', rate: 1500 };

      // First user exists, second doesn't
      userRepository.findOne.mockResolvedValueOnce(user1).mockResolvedValueOnce(null);

      mockManager.findOne.mockResolvedValue(null);
      mockManager.create.mockReturnValue(newRate);
      mockManager.save.mockResolvedValue(newRate);

      const batchData = {
        changes: [
          {
            userId: 'user1',
            rate: 1500,
            comment: 'Valid user',
            type: EUserTrackerRateType.GLOBAL,
          },
          {
            userId: 'nonexistent-user',
            rate: 2000,
            comment: 'Invalid user',
            type: EUserTrackerRateType.GLOBAL,
          },
        ],
      };

      const result = await service.batchUpdateRates(batchData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].success).toBe(true);
        expect(result.data[1].success).toBe(false);
      }
    });
  });

  describe('findRateFromMap', () => {
    it('should return project rate with highest priority', () => {
      const rateMap = new Map([
        ['user123:global', 1000],
        ['user123:queue:ZOTA', 1200],
        ['user123:project:PROJ123', 1500],
      ]);

      const result = UserTrackerRateService.findRateFromMap(rateMap, 'user123', 'PROJ123', 'ZOTA');
      expect(result).toBe(1500); // Project rate has highest priority
    });

    it('should return queue rate when project rate not found', () => {
      const rateMap = new Map([
        ['user123:global', 1000],
        ['user123:queue:ZOTA', 1200],
      ]);

      const result = UserTrackerRateService.findRateFromMap(rateMap, 'user123', 'NONEXISTENT', 'ZOTA');
      expect(result).toBe(1200); // Falls back to queue rate
    });

    it('should return global rate when project and queue not found', () => {
      const rateMap = new Map([['user123:global', 1000]]);

      const result = UserTrackerRateService.findRateFromMap(rateMap, 'user123', 'NONEXISTENT', 'NONEXISTENT');
      expect(result).toBe(1000); // Falls back to global rate
    });

    it('should return 0 when no rate found', () => {
      const rateMap = new Map([['otheruser:global', 1000]]);

      const result = UserTrackerRateService.findRateFromMap(rateMap, 'user123', 'PROJ123', 'ZOTA');
      expect(result).toBe(0); // No rate found for this user
    });

    it('should work without project and queue parameters', () => {
      const rateMap = new Map([
        ['user123:global', 1000],
        ['user123:queue:ZOTA', 1200],
      ]);

      const result = UserTrackerRateService.findRateFromMap(rateMap, 'user123');
      expect(result).toBe(1000); // Only global rate should be found
    });
  });
});
