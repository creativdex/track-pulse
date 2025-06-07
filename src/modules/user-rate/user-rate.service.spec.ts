import { Test, TestingModule } from '@nestjs/testing';
import { UserRateService } from './user-rate.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRateEntity } from './user-rate.entity';
import { UserEntity } from '../user/user.entity';

const mockUserRepository = () => ({
  findOne: jest.fn(),
});
const mockUserRateRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
});

describe('UserRateService', () => {
  let service: UserRateService;
  let userRepository: ReturnType<typeof mockUserRepository>;
  let userRateRepository: ReturnType<typeof mockUserRateRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRateService,
        { provide: getRepositoryToken(UserRateEntity), useFactory: mockUserRateRepository },
        { provide: getRepositoryToken(UserEntity), useFactory: mockUserRepository },
      ],
    }).compile();

    service = module.get<UserRateService>(UserRateService);
    userRepository = module.get(getRepositoryToken(UserEntity));
    userRateRepository = module.get(getRepositoryToken(UserRateEntity));
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
