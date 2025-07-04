import { Test, TestingModule } from '@nestjs/testing';
import { UserTrackerService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserTrackerEntity } from './user.entity';
import { EUserTrackerRateType } from '../user-rate/models/user-rate.model';

const mockUserRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('UserService', () => {
  let service: UserTrackerService;
  let userRepository: ReturnType<typeof mockUserRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserTrackerService,
        { provide: getRepositoryToken(UserTrackerEntity), useFactory: mockUserRepository },
      ],
    }).compile();

    service = module.get<UserTrackerService>(UserTrackerService);
    userRepository = module.get(getRepositoryToken(UserTrackerEntity));
  });

  /**
   * Возвращает всех пользователей с их последним rate.
   */
  it('should return all users (default: exclude dismissed)', async () => {
    const users = [{ id: '1', rates: [{ rate: 5, createdAt: new Date() }] }];
    userRepository.find.mockResolvedValue(users);
    const result = await service.findAll();
    expect(result.success).toBe(true);
    expect(userRepository.find).toHaveBeenCalledWith({
      where: { dismissed: false },
      relations: ['rates'],
    });
    if (result.success) {
      expect(result.data[0].id).toBe('1');
    }
  });

  /**
   * Возвращает всех пользователей, включая dismissed, когда передан параметр includeDismissed=true.
   */
  it('should return all users including dismissed when includeDismissed=true', async () => {
    const users = [
      { id: '1', dismissed: false, rates: [{ rate: 5, createdAt: new Date() }] },
      { id: '2', dismissed: true, rates: [{ rate: 3, createdAt: new Date() }] },
    ];
    userRepository.find.mockResolvedValue(users);
    const result = await service.findAll(true);
    expect(result.success).toBe(true);
    expect(userRepository.find).toHaveBeenCalledWith({
      where: {},
      relations: ['rates'],
    });
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe('1');
      expect(result.data[1].id).toBe('2');
    }
  });

  /**
   * Возвращает только не dismissed пользователей, когда передан параметр includeDismissed=false.
   */
  it('should return only non-dismissed users when includeDismissed=false', async () => {
    const users = [{ id: '1', dismissed: false, rates: [{ rate: 5, createdAt: new Date() }] }];
    userRepository.find.mockResolvedValue(users);
    const result = await service.findAll(false);
    expect(result.success).toBe(true);
    expect(userRepository.find).toHaveBeenCalledWith({
      where: { dismissed: false },
      relations: ['rates'],
    });
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('1');
    }
  });

  /**
   * Возвращает пользователя по id, если найден.
   */
  it('should return user by id', async () => {
    const user = { id: '1', rates: [{ rate: 7, createdAt: new Date() }] };
    userRepository.findOne.mockResolvedValue(user);
    const result = await service.findById('1');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('1');
    }
  });

  /**
   * Возвращает ошибку, если пользователь по id не найден.
   */
  it('should return error if user by id not found', async () => {
    userRepository.findOne.mockResolvedValue(null);
    const result = await service.findById('2');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/not found/);
    }
  });

  /**
   * Создаёт пользователя, если такого email/login ещё нет.
   */
  it('should create user if not exists', async () => {
    userRepository.findOne.mockResolvedValue(null);
    const user = {
      id: '1',
      rates: [],
      trackerUid: ['1'], // исправлено: массив строк
      email: 'a@a.a',
      login: 'login',
      display: 'User',
      roles: [],
      dismissed: false,
    };
    userRepository.create.mockReturnValue(user);
    userRepository.save.mockResolvedValue(user);
    const result = await service.create({
      trackerUid: '1', // строка
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

  /**
   * Не создаёт пользователя, если такой email/login уже есть.
   */
  it('should not create user if exists', async () => {
    userRepository.findOne.mockResolvedValue({ id: '1', trackerUid: ['1'] }); // исправлено: массив
    const result = await service.create({
      trackerUid: '1',
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

  /**
   * Обновляет пользователя, если он существует.
   */
  it('should update user if exists', async () => {
    const user = { id: '1', rates: [] };
    userRepository.findOne.mockResolvedValueOnce(user); // findById
    userRepository.update.mockResolvedValue(undefined);
    userRepository.findOne.mockResolvedValueOnce({ ...user, rates: [{ rate: 10, createdAt: new Date() }] });
    const result = await service.update('1', { login: 'new' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('1');
    }
  });

  /**
   * Возвращает ошибку, если обновляемого пользователя не существует.
   */
  it('should return error if update user not found', async () => {
    userRepository.findOne.mockResolvedValue(null);
    const result = await service.update('2', { login: 'new' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/not found/);
    }
  });

  /**
   * Удаляет пользователя по id.
   */
  it('should delete user', async () => {
    userRepository.delete.mockResolvedValue(undefined);
    await expect(service.delete('1')).resolves.toBeUndefined();
    expect(userRepository.delete).toHaveBeenCalledWith('1');
  });

  /**
   * Находит пользователя по trackerUid (поиск по массиву).
   */
  it('should find user by trackerUid', async () => {
    const user = { id: '1', trackerUid: ['1'], rates: [] }; // исправлено: массив
    userRepository.findOne.mockResolvedValue(user);
    const result = await service.findByTrackerUid('1');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.trackerUid).toEqual(['1']); // исправлено: массив
    }
  });

  it('should return error if user not found by trackerUid', async () => {
    userRepository.findOne.mockResolvedValue(null);
    const result = await service.findByTrackerUid('not-exist');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/not found/);
    }
  });

  it('should return null rate if rates is empty', async () => {
    const user = { id: '3', rates: [], trackerUid: ['3'] };
    userRepository.find.mockResolvedValue([user]);
    const result = await service.findAll();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].rate).toBeNull();
    }
  });

  /**
   * Возвращает всех пользователей с активными ставками указанного типа.
   */
  it('should return all users filtered by rate type', async () => {
    const users = [
      {
        id: '1',
        rates: [{ rate: 5, type: 'global', isActive: true, contextValue: null, createdAt: new Date() }],
      },
      {
        id: '2',
        rates: [{ rate: 7, type: 'project', isActive: true, contextValue: 'PROJECT-123', createdAt: new Date() }],
      },
      {
        id: '3',
        rates: [{ rate: 3, type: 'queue', isActive: false, contextValue: 'SUPPORT', createdAt: new Date() }],
      },
    ];
    userRepository.find.mockResolvedValue(users);
    const result = await service.findAllByRateType(EUserTrackerRateType.GLOBAL);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(3);
      expect(result.data[0].rate).toBe(5); // У первого пользователя есть глобальная ставка
      expect(result.data[1].rate).toBeNull(); // У второго нет глобальной ставки
      expect(result.data[2].rate).toBeNull(); // У третьего нет активной ставки
    }
  });

  /**
   * Возвращает всех пользователей с активными ставками указанного типа и контекста.
   */
  it('should return all users filtered by rate type and context', async () => {
    const users = [
      {
        id: '1',
        rates: [{ rate: 5, type: 'project', isActive: true, contextValue: 'PROJECT-123', createdAt: new Date() }],
      },
      {
        id: '2',
        rates: [{ rate: 7, type: 'project', isActive: true, contextValue: 'PROJECT-456', createdAt: new Date() }],
      },
      {
        id: '3',
        rates: [{ rate: 3, type: 'project', isActive: false, contextValue: 'PROJECT-123', createdAt: new Date() }],
      },
    ];
    userRepository.find.mockResolvedValue(users);
    const result = await service.findAllByRateType(EUserTrackerRateType.PROJECT, 'PROJECT-123');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(3);
      expect(result.data[0].rate).toBe(5); // У первого есть активная ставка для PROJECT-123
      expect(result.data[1].rate).toBeNull(); // У второго ставка для другого проекта
      expect(result.data[2].rate).toBeNull(); // У третьего неактивная ставка
    }
  });

  /**
   * Возвращает всех пользователей с активными ставками указанного типа без учета контекста.
   */
  it('should return all users filtered by rate type without context', async () => {
    const users = [
      {
        id: '1',
        rates: [{ rate: 5, type: 'project', isActive: true, contextValue: 'PROJECT-123', createdAt: new Date() }],
      },
      {
        id: '2',
        rates: [{ rate: 7, type: 'project', isActive: true, contextValue: 'PROJECT-456', createdAt: new Date() }],
      },
      {
        id: '3',
        rates: [{ rate: 3, type: 'queue', isActive: true, contextValue: 'SUPPORT', createdAt: new Date() }],
      },
    ];
    userRepository.find.mockResolvedValue(users);
    const result = await service.findAllByRateType(EUserTrackerRateType.PROJECT); // без контекста
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(3);
      expect(result.data[0].rate).toBe(5); // У первого есть активная ставка типа project
      expect(result.data[1].rate).toBe(7); // У второго тоже есть активная ставка типа project
      expect(result.data[2].rate).toBeNull(); // У третьего ставка другого типа
    }
  });

  /**
   * Возвращает всех пользователей включая dismissed при фильтрации по типу ставки.
   */
  it('should return all users including dismissed when filtering by rate type with includeDismissed=true', async () => {
    const users = [
      {
        id: '1',
        dismissed: false,
        rates: [{ rate: 5, type: 'global', isActive: true, contextValue: null, createdAt: new Date() }],
      },
      {
        id: '2',
        dismissed: true,
        rates: [{ rate: 7, type: 'global', isActive: true, contextValue: null, createdAt: new Date() }],
      },
    ];
    userRepository.find.mockResolvedValue(users);
    const result = await service.findAllByRateType(EUserTrackerRateType.GLOBAL, undefined, true);
    expect(result.success).toBe(true);
    expect(userRepository.find).toHaveBeenCalledWith({
      where: {},
      relations: ['rates'],
    });
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].rate).toBe(5);
      expect(result.data[1].rate).toBe(7);
    }
  });
});
