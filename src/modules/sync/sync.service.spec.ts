import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { UserService } from '../user/user.service';
import { YaTrackerClient } from '@src/shared/clients/ya-tracker/ya-tracker.client';

const mockUserService = () => ({
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
});
const mockYaTrackerClient = () => ({
  users: { getUsers: jest.fn() },
});

describe('SyncService', () => {
  let service: SyncService;
  let userService: ReturnType<typeof mockUserService>;
  let yaTrackerClient: ReturnType<typeof mockYaTrackerClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        { provide: UserService, useFactory: mockUserService },
        { provide: YaTrackerClient, useFactory: mockYaTrackerClient },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
    userService = module.get(UserService);
    yaTrackerClient = module.get(YaTrackerClient);
  });

  it('should sync and create new users', async () => {
    yaTrackerClient.users.getUsers.mockResolvedValue({
      success: true,
      data: [{ uid: 1, email: 'a@a.a', login: 'login', display: 'User' }],
    });
    userService.findAll.mockResolvedValue({ success: true, data: [] });
    userService.create.mockResolvedValue({
      success: true,
      data: {
        id: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        trackerUid: 1,
        email: 'a@a.a',
        login: 'login',
        display: 'User',
        roles: [],
        dismissed: false,
        rate: null,
      },
    });

    const result = await service.syncUsers();
    if (result.success) {
      expect(result.data.created).toBe(1);
      expect(result.data.updated).toBe(0);
      expect(result.data.failed).toBe(0);
    } else {
      throw new Error(result.error);
    }
    expect(userService.create).toHaveBeenCalledWith({
      trackerUid: 1,
      email: 'a@a.a',
      login: 'login',
      display: 'User',
      roles: [],
      dismissed: false,
    });
  });

  it('should sync and update existing users', async () => {
    yaTrackerClient.users.getUsers.mockResolvedValue({
      success: true,
      data: [{ uid: 2, email: 'b@b.b', login: 'login2', display: 'User2' }],
    });
    userService.findAll.mockResolvedValue({
      success: true,
      data: [
        {
          id: '2',
          createdAt: new Date(),
          updatedAt: new Date(),
          trackerUid: 2,
          email: 'old@b.b',
          login: 'login2',
          display: 'Old',
          roles: [],
          dismissed: true,
          rate: null,
        },
      ],
    });
    userService.update.mockResolvedValue({
      success: true,
      data: {
        id: '2',
        createdAt: new Date(),
        updatedAt: new Date(),
        trackerUid: 2,
        email: 'b@b.b',
        login: 'login2',
        display: 'User2',
        roles: [],
        dismissed: false,
        rate: null,
      },
    });

    const result = await service.syncUsers();
    if (result.success) {
      expect(result.data.created).toBe(0);
      expect(result.data.updated).toBe(1);
      expect(result.data.failed).toBe(0);
    } else {
      throw new Error(result.error);
    }
    expect(userService.update).toHaveBeenCalledWith('2', {
      trackerUid: 2,
      email: 'b@b.b',
      login: 'login2',
      display: 'User2',
      roles: [],
      dismissed: false,
    });
  });

  it('should count failed if user creation fails', async () => {
    yaTrackerClient.users.getUsers.mockResolvedValue({
      success: true,
      data: [{ uid: 3, email: 'c@c.c', login: 'login3', display: 'User3' }],
    });
    userService.findAll.mockResolvedValue({ success: true, data: [] });
    userService.create.mockResolvedValue({ success: false, error: 'fail' });

    const result = await service.syncUsers();
    if (result.success) {
      expect(result.data.created).toBe(0);
      expect(result.data.updated).toBe(0);
      expect(result.data.failed).toBe(1);
    } else {
      throw new Error(result.error);
    }
  });

  it('should count failed if user update fails', async () => {
    yaTrackerClient.users.getUsers.mockResolvedValue({
      success: true,
      data: [{ uid: 4, email: 'd@d.d', login: 'login4', display: 'User4' }],
    });
    userService.findAll.mockResolvedValue({
      success: true,
      data: [
        {
          id: '4',
          createdAt: new Date(),
          updatedAt: new Date(),
          trackerUid: 4,
          email: 'old@d.d',
          login: 'login4',
          display: 'Old',
          roles: [],
          dismissed: true,
          rate: null,
        },
      ],
    });
    userService.update.mockResolvedValue({ success: false, error: 'fail' });

    const result = await service.syncUsers();
    if (result.success) {
      expect(result.data.created).toBe(0);
      expect(result.data.updated).toBe(0);
      expect(result.data.failed).toBe(1);
    } else {
      throw new Error(result.error);
    }
  });

  it('should handle fetch errors gracefully', async () => {
    yaTrackerClient.users.getUsers.mockResolvedValue({ success: false, error: { message: 'fail' } });
    const result = await service.syncUsers();
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result).toHaveProperty('error');
      expect(result.error).toBeDefined();
    }
  });
});
