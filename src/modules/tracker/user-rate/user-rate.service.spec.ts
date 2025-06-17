import { Test, TestingModule } from '@nestjs/testing';
import { UserTrackerRateService } from './user-rate.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserTrackerRateEntity } from './user-rate.entity';
import { UserTrackerEntity } from '../user/user.entity';

const mockUserRepository = () => ({
  findOne: jest.fn(),
});
const mockUserRateRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
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
    userRepository.findOne.mockResolvedValue(null);
    const result = await service.create({ userId: '1', rate: 5 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/not found/);
    }
  });

  it('should create and save user rate if user exists', async () => {
    const user = { id: '1' };
    const userRate = { id: '2', userId: '1', rate: 5, createdAt: new Date(), updatedAt: new Date() };
    userRepository.findOne.mockResolvedValue(user);
    userRateRepository.create.mockReturnValue(userRate);
    userRateRepository.save.mockResolvedValue(userRate);

    const result = await service.create({ userId: '1', rate: 5 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(userRate);
    }
    expect(userRateRepository.create).toHaveBeenCalledWith({ userId: '1', rate: 5 });
    expect(userRateRepository.save).toHaveBeenCalledWith(userRate);
  });
});
