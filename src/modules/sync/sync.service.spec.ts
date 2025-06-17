import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { UserTrackerService } from '../tracker/user/user.service';
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
        { provide: UserTrackerService, useFactory: mockUserService },
        { provide: YaTrackerClient, useFactory: mockYaTrackerClient },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
    userService = module.get(UserTrackerService);
    yaTrackerClient = module.get(YaTrackerClient);
  });

  /**
   * Синхронизация: создаёт нового пользователя, если его нет в локальной базе.
   * Проверяет, что userService.create вызывается с корректными данными.
   */
  it('should sync and create new users', async () => {
    yaTrackerClient.users.getUsers.mockResolvedValue({
      success: true,
      data: [{ uid: '1', email: 'a@a.a', login: 'login', display: 'User' }],
    });
    userService.findAll.mockResolvedValue({ success: true, data: [] });
    userService.create.mockResolvedValue({
      success: true,
      data: {
        id: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        trackerUid: ['1'],
        email: 'a@a.a',
        login: 'login',
        display: 'User',
        roles: [],
        dismissed: false,
        rate: null,
      },
    });
    userService.update.mockResolvedValue({ success: true, data: {} }); // для возможного update после create

    const result = await service.syncUsers();
    if (result.success) {
      expect(result.data.created).toBe(1);
      expect(result.data.updated).toBe(0);
      expect(result.data.failed).toBe(0);
    } else {
      throw new Error(result.error);
    }
    expect(userService.create).toHaveBeenCalledWith({
      trackerUid: '1',
      email: 'a@a.a',
      login: 'login',
      display: 'User',
      roles: [],
      dismissed: false,
    });
  });

  /**
   * Синхронизация: обновляет существующего пользователя, если данные отличаются.
   * Проверяет, что userService.update вызывается с изменёнными полями.
   */
  it('should sync and update existing users', async () => {
    yaTrackerClient.users.getUsers.mockResolvedValue({
      success: true,
      data: [{ uid: '2', email: 'b@b.b', login: 'login2', display: 'User2' }],
    });
    userService.findAll.mockResolvedValue({
      success: true,
      data: [
        {
          id: '2',
          createdAt: new Date(),
          updatedAt: new Date(),
          trackerUid: ['2'],
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
        trackerUid: ['2'],
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
    expect(userService.update).toHaveBeenCalledWith(
      '2',
      expect.objectContaining({
        email: 'b@b.b',
        login: 'login2',
        display: 'User2',
        dismissed: false,
      }),
    );
  });

  /**
   * Синхронизация: учитывает ошибку при создании пользователя.
   * Проверяет, что failed увеличивается, если userService.create возвращает ошибку.
   */
  it('should count failed if user creation fails', async () => {
    yaTrackerClient.users.getUsers.mockResolvedValue({
      success: true,
      data: [{ uid: '3', email: 'c@c.c', login: 'login3', display: 'User3' }],
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

  /**
   * Синхронизация: учитывает ошибку при обновлении пользователя.
   * Проверяет, что failed увеличивается, если userService.update возвращает ошибку.
   */
  it('should count failed if user update fails', async () => {
    yaTrackerClient.users.getUsers.mockResolvedValue({
      success: true,
      data: [{ uid: '4', email: 'd@d.d', login: 'login4', display: 'User4' }],
    });
    userService.findAll.mockResolvedValue({
      success: true,
      data: [
        {
          id: '4',
          createdAt: new Date(),
          updatedAt: new Date(),
          trackerUid: ['4'], // исправлено
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

  /**
   * Синхронизация: корректно обрабатывает ошибку получения данных из YaTracker.
   * Проверяет, что сервис возвращает ошибку при неуспешном ответе YaTracker.
   */
  it('should handle fetch errors gracefully', async () => {
    yaTrackerClient.users.getUsers.mockResolvedValue({ success: false, error: { message: 'fail' } });
    const result = await service.syncUsers();
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result).toHaveProperty('error');
      expect(result.error).toBeDefined();
    }
  });

  /**
   * Синхронизация: добавляет trackerUid существующему пользователю и обновляет поля, если нужно.
   * Проверяет, что userService.update вызывается с trackerUid и с обновлёнными полями.
   */
  it('should sync and add trackerUid to existing user and update fields if needed', async () => {
    yaTrackerClient.users.getUsers.mockResolvedValue({
      success: true,
      data: [{ uid: '5', email: 'e@e.e', login: 'login5', display: 'User5' }],
    });
    userService.findAll.mockResolvedValue({
      success: true,
      data: [
        {
          id: '5',
          createdAt: new Date(),
          updatedAt: new Date(),
          trackerUid: [],
          email: 'old@e.e',
          login: 'login5',
          display: 'Old',
          roles: [],
          dismissed: true,
          rate: null,
        },
      ],
    });
    userService.create.mockResolvedValue({
      success: true,
      data: {
        id: '5',
        createdAt: new Date(),
        updatedAt: new Date(),
        trackerUid: ['5'],
        email: 'old@e.e',
        login: 'login5',
        display: 'Old',
        roles: [],
        dismissed: true,
        rate: null,
      },
    });
    userService.update.mockResolvedValue({
      success: true,
      data: {
        id: '5',
        createdAt: new Date(),
        updatedAt: new Date(),
        trackerUid: ['5'],
        email: 'e@e.e',
        login: 'login5',
        display: 'User5',
        roles: [],
        dismissed: false,
        rate: null,
      },
    });

    const result = await service.syncUsers();
    if (result.success) {
      expect(result.data.created).toBe(0);
      expect(result.data.updated).toBe(2); // исправлено: ожидаем 2 обновления
      expect(result.data.failed).toBe(0);
    } else {
      throw new Error(result.error);
    }
    // Проверяем, что update был вызван с trackerUid и с обновлёнными полями (может быть два вызова)
    expect(userService.update).toHaveBeenCalledWith('5', expect.objectContaining({ trackerUid: ['5'] }));
    expect(userService.update).toHaveBeenCalledWith(
      '5',
      expect.objectContaining({
        email: 'e@e.e',
        login: 'login5',
        display: 'User5',
        dismissed: false,
      }),
    );
  });
});
