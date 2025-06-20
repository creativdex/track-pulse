import { Test, TestingModule } from '@nestjs/testing';
import { YaTrackerEntityClient } from './entity.client';
import { YaTrackerClient } from '../ya-tracker.client';
import { ITrackerGetEntity } from './models/get-entity.model';
import { ITrackerEntity } from './models/entity.model';
import { EHttpMethod } from '@src/shared/abstract/http-client/http-client.abstract.enum';
import { ETrackerEntityType } from './entity.enum';
import { ITrackerSearchEntity, ITrackerSearchEntityResult } from './models/search-entity.models';

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
    const mockEntity: ITrackerEntity = { id: '123' };

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

  describe('searchEntity', () => {
    const mockPayload: ITrackerSearchEntity = {
      path: { typeEntity: ETrackerEntityType.PROJECT },
      query: { fields: 'id,name' },
      body: { filter: { name: 'Test' } },
    };
    const mockResult: ITrackerSearchEntityResult = { hits: 1, pages: 1, values: [{ id: '1' }] };

    it('should search entity successfully', async () => {
      mockBaseClient.makeRequest.mockResolvedValue({ success: true, data: mockResult });
      const result = await entityClient.searchEntity(mockPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockResult);
      }
      expect(mockBaseClient.makeRequest).toHaveBeenCalledWith(
        {
          method: EHttpMethod.POST,
          endpoint: 'entities/project/_search',
          params: { fields: 'id,name' },
          data: { filter: { name: 'Test' } },
          contentType: 'application/json',
        },
        'search_entity',
      );
    });

    it('should handle search entity error', async () => {
      const mockError = new Error('Search error');
      mockBaseClient.makeRequest.mockResolvedValue({ success: false, error: mockError });
      const result = await entityClient.searchEntity(mockPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(mockError);
      }
    });

    it('should log search entity attempt', async () => {
      const logSpy = jest.spyOn(entityClient['logger'], 'log');
      mockBaseClient.makeRequest.mockResolvedValue({ success: true, data: mockResult });
      await entityClient.searchEntity(mockPayload);
      expect(logSpy).toHaveBeenCalledWith('Searching entity', { typeEntity: ETrackerEntityType.PROJECT });
    });
  });
});
