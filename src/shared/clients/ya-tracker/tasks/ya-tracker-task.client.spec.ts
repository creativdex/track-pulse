import { Test, TestingModule } from '@nestjs/testing';
import { YaTrackerTaskClient } from './ya-tracker-task.client';
import { YaTrackerClient } from '../ya-tracker.client';
import { ICreateTask } from './models/create-task.model';
import { ITrackerTask } from './models/task.model';
import { ISearchTasksRequest, ISearchTasksOptions } from './models/search-tasks.model';
import { EHttpMethod, EContentType } from '@src/shared/abstract/http-client/http-client.abstract.enum';

describe('YaTrackerTaskClient', () => {
  let taskClient: YaTrackerTaskClient;
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
    taskClient = new YaTrackerTaskClient(baseClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should be defined', () => {
      expect(taskClient).toBeDefined();
    });

    it('should initialize with base client', () => {
      expect(taskClient['baseClient']).toBe(baseClient);
    });
  });

  describe('createTask', () => {
    const mockTaskPayload: ICreateTask = {
      summary: 'Test Task',
      queue: 'TEST',
      description: 'Test description',
      type: 'task',
      priority: 'normal',
    };

    const mockCreatedTask: ITrackerTask = {
      self: 'https://api.tracker.yandex.net/v2/issues/TEST-1',
      id: 'test-id-1',
      key: 'TEST-1',
      version: 1,
      lastCommentUpdatedAt: '2024-01-01T00:00:00.000Z',
      summary: 'Test Task',
      updatedBy: {
        self: 'https://api.tracker.yandex.net/v2/users/user1',
        id: 'user1',
        display: 'Test User',
      },
      description: 'Test description',
      type: {
        self: 'https://api.tracker.yandex.net/v2/issueTypes/1',
        id: '1',
        key: 'task',
        display: 'Task',
      },
      priority: {
        self: 'https://api.tracker.yandex.net/v2/priorities/2',
        id: '2',
        key: 'normal',
        display: 'Normal',
      },
      createdAt: '2024-01-01T00:00:00.000Z',
      followers: [],
      createdBy: {
        self: 'https://api.tracker.yandex.net/v2/users/user1',
        id: 'user1',
        display: 'Test User',
      },
      votes: 0,
      assignee: {
        self: 'https://api.tracker.yandex.net/v2/users/user1',
        id: 'user1',
        display: 'Test User',
      },
      project: {
        primary: {
          self: 'https://api.tracker.yandex.net/v2/projects/1',
          id: '1',
          display: 'Test Project',
        },
        secondary: [],
      },
      queue: {
        self: 'https://api.tracker.yandex.net/v2/queues/TEST',
        id: 'test-queue-id',
        key: 'TEST',
        display: 'Test Queue',
      },
      updatedAt: '2024-01-01T00:00:00.000Z',
      status: {
        self: 'https://api.tracker.yandex.net/v2/statuses/1',
        id: '1',
        key: 'open',
        display: 'Open',
      },
      favorite: false,
    };

    it('should create task successfully', async () => {
      mockBaseClient.makeRequest.mockResolvedValue({
        success: true,
        data: mockCreatedTask,
      });

      const result = await taskClient.createTask(mockTaskPayload);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockCreatedTask);
      }
      expect(mockBaseClient.makeRequest).toHaveBeenCalledWith(
        {
          method: EHttpMethod.POST,
          endpoint: 'issues',
          data: mockTaskPayload,
          contentType: EContentType.JSON,
        },
        'create_task',
      );
    });

    it('should handle task creation error', async () => {
      const mockError = new Error('API Error');
      mockBaseClient.makeRequest.mockResolvedValue({
        success: false,
        error: mockError,
      });

      const result = await taskClient.createTask(mockTaskPayload);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(mockError);
      }
    });

    it('should log task creation attempt', async () => {
      const logSpy = jest.spyOn(taskClient['logger'], 'log');
      mockBaseClient.makeRequest.mockResolvedValue({
        success: true,
        data: mockCreatedTask,
      });

      await taskClient.createTask(mockTaskPayload);

      expect(logSpy).toHaveBeenCalledWith('Creating task', { summary: mockTaskPayload.summary });
    });
  });

  describe('getTask', () => {
    const mockTask: ITrackerTask = {
      self: 'https://api.tracker.yandex.net/v2/issues/TEST-1',
      id: 'test-id-1',
      key: 'TEST-1',
      version: 1,
      lastCommentUpdatedAt: '2024-01-01T00:00:00.000Z',
      summary: 'Test Task',
      updatedBy: {
        self: 'https://api.tracker.yandex.net/v2/users/user1',
        id: 'user1',
        display: 'Test User',
      },
      description: 'Test description',
      type: {
        self: 'https://api.tracker.yandex.net/v2/issueTypes/1',
        id: '1',
        key: 'task',
        display: 'Task',
      },
      priority: {
        self: 'https://api.tracker.yandex.net/v2/priorities/2',
        id: '2',
        key: 'normal',
        display: 'Normal',
      },
      createdAt: '2024-01-01T00:00:00.000Z',
      followers: [],
      createdBy: {
        self: 'https://api.tracker.yandex.net/v2/users/user1',
        id: 'user1',
        display: 'Test User',
      },
      votes: 0,
      assignee: {
        self: 'https://api.tracker.yandex.net/v2/users/user1',
        id: 'user1',
        display: 'Test User',
      },
      project: {
        primary: {
          self: 'https://api.tracker.yandex.net/v2/projects/1',
          id: '1',
          display: 'Test Project',
        },
        secondary: [],
      },
      queue: {
        self: 'https://api.tracker.yandex.net/v2/queues/TEST',
        id: 'test-queue-id',
        key: 'TEST',
        display: 'Test Queue',
      },
      updatedAt: '2024-01-01T00:00:00.000Z',
      status: {
        self: 'https://api.tracker.yandex.net/v2/statuses/1',
        id: '1',
        key: 'open',
        display: 'Open',
      },
      favorite: false,
    };

    it('should get task by key successfully', async () => {
      mockBaseClient.makeRequest.mockResolvedValue({
        success: true,
        data: mockTask,
      });

      const result = await taskClient.getTask('TEST-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockTask);
      }
      expect(mockBaseClient.makeRequest).toHaveBeenCalledWith(
        {
          method: EHttpMethod.GET,
          endpoint: 'issues/TEST-1',
          contentType: EContentType.JSON,
        },
        'get_task',
      );
    });

    it('should handle get task error', async () => {
      const mockError = new Error('Task not found');
      mockBaseClient.makeRequest.mockResolvedValue({
        success: false,
        error: mockError,
      });

      const result = await taskClient.getTask('NONEXISTENT-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(mockError);
      }
    });

    it('should log get task attempt', async () => {
      const logSpy = jest.spyOn(taskClient['logger'], 'log');
      mockBaseClient.makeRequest.mockResolvedValue({
        success: true,
        data: mockTask,
      });

      await taskClient.getTask('TEST-1');

      expect(logSpy).toHaveBeenCalledWith('Getting task', { taskKey: 'TEST-1' });
    });
  });

  describe('searchTasks', () => {
    const mockSearchRequest: ISearchTasksRequest = {
      filter: { queue: 'TEST' },
      order: 'created',
    };

    it('should search tasks with default options', async () => {
      const onPageMock = jest.fn();
      mockBaseClient.requestAllData.mockResolvedValue(undefined);

      await taskClient.searchTasks(mockSearchRequest, {}, onPageMock);

      expect(mockBaseClient.requestAllData).toHaveBeenCalledWith(
        {
          method: EHttpMethod.POST,
          endpoint: 'issues/_search',
          data: mockSearchRequest,
          contentType: EContentType.JSON,
          params: {},
        },
        'search_tasks',
        onPageMock,
        undefined,
      );
    });

    it('should search tasks with expand options', async () => {
      const onPageMock = jest.fn();
      const options: ISearchTasksOptions = {
        expand: {
          transitions: true,
          attachments: true,
        },
        strategy: 'scroll',
      };

      await taskClient.searchTasks(mockSearchRequest, options, onPageMock);

      expect(mockBaseClient.requestAllData).toHaveBeenCalledWith(
        {
          method: EHttpMethod.POST,
          endpoint: 'issues/_search',
          data: mockSearchRequest,
          contentType: EContentType.JSON,
          params: {
            expand: 'transitions,attachments',
          },
        },
        'search_tasks',
        onPageMock,
        'scroll',
      );
    });

    it('should log search attempt', async () => {
      const logSpy = jest.spyOn(taskClient['logger'], 'log');
      const onPageMock = jest.fn();

      await taskClient.searchTasks(mockSearchRequest, {}, onPageMock);

      expect(logSpy).toHaveBeenCalledWith('Searching tasks', {
        hasFilter: true,
        hasQuery: false,
        queue: undefined,
        strategy: undefined,
      });
    });
  });

  describe('searchTasksToArray', () => {
    it('should collect all tasks into array', async () => {
      const mockTasks: ITrackerTask[] = [
        {
          self: 'https://api.tracker.yandex.net/v2/issues/TEST-1',
          id: 'test-id-1',
          key: 'TEST-1',
          version: 1,
          lastCommentUpdatedAt: '2024-01-01T00:00:00.000Z',
          summary: 'Test Task 1',
          updatedBy: {
            self: 'https://api.tracker.yandex.net/v2/users/user1',
            id: 'user1',
            display: 'Test User',
          },
          description: 'Test description 1',
          type: {
            self: 'https://api.tracker.yandex.net/v2/issueTypes/1',
            id: '1',
            key: 'task',
            display: 'Task',
          },
          priority: {
            self: 'https://api.tracker.yandex.net/v2/priorities/2',
            id: '2',
            key: 'normal',
            display: 'Normal',
          },
          createdAt: '2024-01-01T00:00:00.000Z',
          followers: [],
          createdBy: {
            self: 'https://api.tracker.yandex.net/v2/users/user1',
            id: 'user1',
            display: 'Test User',
          },
          votes: 0,
          assignee: {
            self: 'https://api.tracker.yandex.net/v2/users/user1',
            id: 'user1',
            display: 'Test User',
          },
          project: {
            primary: {
              self: 'https://api.tracker.yandex.net/v2/projects/1',
              id: '1',
              display: 'Test Project',
            },
            secondary: [],
          },
          queue: {
            self: 'https://api.tracker.yandex.net/v2/queues/TEST',
            id: 'test-queue-id',
            key: 'TEST',
            display: 'Test Queue',
          },
          updatedAt: '2024-01-01T00:00:00.000Z',
          status: {
            self: 'https://api.tracker.yandex.net/v2/statuses/1',
            id: '1',
            key: 'open',
            display: 'Open',
          },
          favorite: false,
        },
      ];

      jest.spyOn(taskClient, 'searchTasks').mockImplementation(async (request, options, onPage) => {
        await onPage(mockTasks, { page: 1, isLast: true });
      });

      const logSpy = jest.spyOn(taskClient['logger'], 'log');

      const result = await taskClient.searchTasksToArray({ queue: 'TEST' });

      expect(result).toEqual(mockTasks);
      expect(logSpy).toHaveBeenCalledWith('Search completed', { totalTasks: 1 });
    });
  });

  describe('Convenience search methods', () => {
    const onPageMock = jest.fn();
    let searchTasksSpy: jest.SpyInstance;

    beforeEach(() => {
      searchTasksSpy = jest.spyOn(taskClient, 'searchTasks').mockResolvedValue(undefined);
    });

    it('should search tasks by queue', async () => {
      await taskClient.searchTasksByQueue('TEST', {}, onPageMock);

      expect(searchTasksSpy).toHaveBeenCalledWith({ queue: 'TEST' }, {}, onPageMock);
    });

    it('should search tasks by single key', async () => {
      await taskClient.searchTasksByKeys('TEST-1', {}, onPageMock);

      expect(searchTasksSpy).toHaveBeenCalledWith({ keys: 'TEST-1' }, {}, onPageMock);
    });

    it('should search tasks by multiple keys', async () => {
      await taskClient.searchTasksByKeys(['TEST-1', 'TEST-2'], {}, onPageMock);

      expect(searchTasksSpy).toHaveBeenCalledWith({ keys: ['TEST-1', 'TEST-2'] }, {}, onPageMock);
    });

    it('should search tasks by filter', async () => {
      const filter = { status: 'open' };
      const order = 'created';

      await taskClient.searchTasksByFilter(filter, onPageMock, order, {});

      expect(searchTasksSpy).toHaveBeenCalledWith({ filter, order }, {}, onPageMock);
    });

    it('should search tasks by query', async () => {
      const query = 'Queue: TEST AND Status: Open';

      await taskClient.searchTasksByQuery(query, {}, onPageMock);

      expect(searchTasksSpy).toHaveBeenCalledWith({ query }, {}, onPageMock);
    });
  });

  describe('buildSearchQueryParams', () => {
    it('should build empty params when no expand provided', () => {
      const result = taskClient['buildSearchQueryParams']();
      expect(result).toEqual({});
    });

    it('should build params with transitions expand', () => {
      const result = taskClient['buildSearchQueryParams']({ transitions: true });
      expect(result).toEqual({ expand: 'transitions' });
    });

    it('should build params with attachments expand', () => {
      const result = taskClient['buildSearchQueryParams']({ attachments: true });
      expect(result).toEqual({ expand: 'attachments' });
    });

    it('should build params with both expands', () => {
      const result = taskClient['buildSearchQueryParams']({
        transitions: true,
        attachments: true,
      });
      expect(result).toEqual({ expand: 'transitions,attachments' });
    });

    it('should not include false expand options', () => {
      const result = taskClient['buildSearchQueryParams']({
        transitions: false,
        attachments: true,
      });
      expect(result).toEqual({ expand: 'attachments' });
    });
  });
});
