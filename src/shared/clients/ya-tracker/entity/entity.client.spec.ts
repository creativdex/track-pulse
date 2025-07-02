import { Test, TestingModule } from '@nestjs/testing';
import { YaTrackerEntityClient } from './entity.client';
import { YaTrackerClient } from '../ya-tracker.client';
import { ITrackerGetEntity } from './models/get-entity.model';
import { ITrackerEntity } from './models/entity.model';
import { EHttpMethod } from '@src/shared/abstract/http-client/http-client.abstract.enum';
import { ETrackerEntityType } from './entity.enum';
import { ITrackerSearchEntity } from './models/search-entity.models';
import { IScrollMeta, IPaginateMeta } from '../ya-tracker.model';

// Mock для jose
jest.mock('jose', () => ({
  importPKCS8: jest.fn().mockResolvedValue('mock-private-key'),
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock-jwt-token'),
  })),
}));

describe('YaTrackerEntityClient', () => {
  let entityClient: YaTrackerEntityClient;
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
    entityClient = new YaTrackerEntityClient(baseClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEntity', () => {
    const mockPayload: ITrackerGetEntity = {
      path: { typeEntity: ETrackerEntityType.PROJECT, id: '123' },
      query: { fields: 'id,name' },
    };
    const mockEntity: ITrackerEntity = {
      id: '123',
      shortId: 1,
    };

    it('should get entity successfully', async () => {
      mockBaseClient.makeRequest.mockResolvedValue({ success: true, data: mockEntity });
      const result = await entityClient.getEntity(mockPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockEntity);
      }
      expect(mockBaseClient.makeRequest).toHaveBeenCalledWith(
        {
          method: EHttpMethod.GET,
          endpoint: 'entities/project/123',
          params: { fields: 'id,name' },
          contentType: 'application/json',
        },
        'get_entity',
      );
    });

    it('should handle get entity error', async () => {
      const mockError = new Error('Not found');
      mockBaseClient.makeRequest.mockResolvedValue({ success: false, error: mockError });
      const result = await entityClient.getEntity(mockPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(mockError);
      }
    });

    it('should log get entity attempt', async () => {
      const logSpy = jest.spyOn(entityClient['logger'], 'log');
      mockBaseClient.makeRequest.mockResolvedValue({ success: true, data: mockEntity });
      await entityClient.getEntity(mockPayload);
      expect(logSpy).toHaveBeenCalledWith('Getting entity', { typeEntity: ETrackerEntityType.PROJECT, id: '123' });
    });
  });

  describe('searchEntityToArray', () => {
    const mockPayload: ITrackerSearchEntity = {
      path: { typeEntity: ETrackerEntityType.PROJECT },
      query: { fields: 'id,name' },
      body: { filter: { name: 'Test' } },
    };
    const mockEntities: ITrackerEntity[] = [{ id: '1', shortId: 1 }];

    it('should search entities successfully', async () => {
      const mockSearchEntity = jest
        .fn()
        .mockImplementation(
          async (
            request: ITrackerSearchEntity,
            options: any,
            onPage: (entities: ITrackerEntity[], meta: IScrollMeta | IPaginateMeta) => Promise<void> | void,
          ) => {
            await onPage(mockEntities, { page: 1 } as IPaginateMeta);
          },
        );
      entityClient.searchEntity = mockSearchEntity;

      const result = await entityClient.searchEntityToArray(mockPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockEntities);
      }
    });

    it('should handle search entities error', async () => {
      const mockError = new Error('Search error');
      const mockSearchEntity = jest.fn().mockRejectedValue(mockError);
      entityClient.searchEntity = mockSearchEntity;

      try {
        await entityClient.searchEntityToArray(mockPayload);
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });
  });

  describe('searchProjectsToArray', () => {
    const mockProjects: ITrackerEntity[] = [
      { id: '1', shortId: 1, fields: { summary: 'Project 1' } },
      { id: '2', shortId: 2, fields: { summary: 'Project 2' } },
    ];

    it('should search projects successfully', async () => {
      const mockSearchEntityToArray = jest.fn().mockResolvedValue({ success: true, data: mockProjects });
      entityClient.searchEntityToArray = mockSearchEntityToArray;

      const result = await entityClient.searchProjectsToArray();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockProjects);
      }
      expect(mockSearchEntityToArray).toHaveBeenCalledWith(
        {
          path: { typeEntity: ETrackerEntityType.PROJECT },
          query: {
            fields:
              'id,shortId,summary,description,author,lead,teamUsers,clients,followers,start,end,checklistItems,tags,parentEntity,teamAccess,quarter,entityStatus,issueQueues',
          },
        },
        {},
      );
    });

    it('should handle search projects error', async () => {
      const mockError = new Error('Search error');
      const mockSearchEntityToArray = jest.fn().mockResolvedValue({ success: false, error: mockError });
      entityClient.searchEntityToArray = mockSearchEntityToArray;

      const result = await entityClient.searchProjectsToArray();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(mockError);
      }
    });
  });
});
