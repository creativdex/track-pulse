import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';

const mockUserRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('UserService', () => {
  let service: UserService;
  let userRepository: ReturnType<typeof mockUserRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: getRepositoryToken(UserEntity), useFactory: mockUserRepository }],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(UserEntity));
  });

  it('should return all users', async () => {
    const users = [{ id: '1', rates: [{ rate: 5, createdAt: new Date() }] }];
    userRepository.find.mockResolvedValue(users);
    const result = await service.findAll();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].id).toBe('1');
      expect(result.data[0]).toHaveProperty('rate', 5);
    }
  });

  it('should return user by id', async () => {
    const user = { id: '1', rates: [{ rate: 7, createdAt: new Date() }] };
    userRepository.findOne.mockResolvedValue(user);
    const result = await service.findById('1');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('1');
      expect(result.data.rate).toBe(7);
    }
  });

  it('should return error if user by id not found', async () => {
    userRepository.findOne.mockResolvedValue(null);
    const result = await service.findById('2');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/not found/);
    }
  });

  it('should create user if not exists', async () => {
    userRepository.findOne.mockResolvedValue(null);
    const user = {
      id: '1',
      rates: [],
      trackerUid: 1,
      email: 'a@a.a',
      login: 'login',
      display: 'User',
      roles: [],
      dismissed: false,
    };
    userRepository.create.mockReturnValue(user);
    userRepository.save.mockResolvedValue(user);
    const result = await service.create({
      trackerUid: 1,
      email: 'a@a.a',
      login: 'login',
      display: 'User',
      roles: [],
      dismissed: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('1');
    }
  });

  it('should not create user if exists', async () => {
    userRepository.findOne.mockResolvedValue({ id: '1' });
    const result = await service.create({
      trackerUid: 1,
      email: 'a@a.a',
      login: 'login',
      display: 'User',
      roles: [],
      dismissed: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/already exists/);
    }
  });

  it('should update user if exists', async () => {
    const user = { id: '1', rates: [] };
    userRepository.findOne.mockResolvedValueOnce(user); // findById
    userRepository.update.mockResolvedValue(undefined);
    userRepository.findOne.mockResolvedValueOnce({ ...user, rates: [{ rate: 10, createdAt: new Date() }] });
    const result = await service.update('1', { login: 'new' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('1');
      expect(result.data.rate).toBe(10);
    }
  });

  it('should return error if update user not found', async () => {
    userRepository.findOne.mockResolvedValue(null);
    const result = await service.update('2', { login: 'new' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/not found/);
    }
  });

  it('should delete user', async () => {
    userRepository.delete.mockResolvedValue(undefined);
    await expect(service.delete('1')).resolves.toBeUndefined();
    expect(userRepository.delete).toHaveBeenCalledWith('1');
  });

  it('should find user by trackerUid', async () => {
    const user = { id: '1', trackerUid: 1, rates: [] };
    userRepository.findOne.mockResolvedValue(user);
    const result = await service.findByTrackerUid(1);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.trackerUid).toBe(1);
    }
  });
});
