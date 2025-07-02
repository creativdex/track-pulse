import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserTrackerRateEntity } from './user-rate.entity';
import { Repository } from 'typeorm';
import { ICreateUserTrackerRate } from './models/create-user-rate.model';
import { IServiceResult } from '@src/shared/types/service-result.type';
import { IUserTrackerRate, EUserTrackerRateType } from './models/user-rate.model';
import { UserTrackerEntity } from '../user/user.entity';
import { IBatchRateUpdate } from './models/batch-rate-update.model';
import { IBatchRateUpdateResult } from './models/batch-rate-update-result.model';

@Injectable()
export class UserTrackerRateService {
  protected readonly logger = new Logger(UserTrackerRateService.name);

  constructor(
    @InjectRepository(UserTrackerRateEntity)
    private readonly userTrackerRateRepository: Repository<UserTrackerRateEntity>,
    @InjectRepository(UserTrackerEntity)
    private readonly userTrackerRepository: Repository<UserTrackerEntity>,
  ) {}

  /**
   * Creates a new user rate.
   * @param userRateData - The data for the user rate to be created.
   * @returns A promise that resolves to the created user rate or an error message.
   */
  async create(userRateData: ICreateUserTrackerRate): Promise<IServiceResult<IUserTrackerRate>> {
    this.logger.log(`Creating user rate for user ${userRateData.userId} with type ${userRateData.type}`);

    return this.userTrackerRateRepository.manager.transaction(async (manager) => {
      // Check if user exists
      const user = await this.userTrackerRepository.findOne({
        where: { id: userRateData.userId },
      });

      if (!user) {
        this.logger.warn(`User with id ${userRateData.userId} not found`);
        return { success: false, error: `User with id ${userRateData.userId} not found` };
      }

      // Find and deactivate existing active rate for the same context
      const whereCondition: Partial<UserTrackerRateEntity> = {
        userId: user.id,
        type: userRateData.type,
        isActive: true,
      };

      if (userRateData.type === EUserTrackerRateType.PROJECT || userRateData.type === EUserTrackerRateType.QUEUE) {
        whereCondition.contextValue = userRateData.contextValue;
      }

      const existingRate = await manager.findOne(UserTrackerRateEntity, { where: whereCondition });

      if (existingRate) {
        await manager.update(UserTrackerRateEntity, { id: existingRate.id }, { isActive: false });
        this.logger.log(
          `Deactivated existing rate ${existingRate.id} for user ${user.id}, type: ${userRateData.type}, context: ${userRateData.contextValue || 'null'}`,
        );
      }

      // Create new rate
      const newRate = manager.create(UserTrackerRateEntity, {
        ...userRateData,
        isActive: true,
      });

      const savedRate = await manager.save(newRate);
      this.logger.log(`User rate created successfully for user ${user.id}: ${savedRate.rate} RUB/hour`);

      return { success: true, data: savedRate };
    });
  }

  /**
   * Finds all active user rates as a Map for efficient lookup.
   * Creates multiple keys per rate to support priority-based lookup.
   * @returns A promise that resolves to a Map with rate lookup keys.
   */
  async findAllActiveRatesAsMap(): Promise<Map<string, number>> {
    const rates = await this.userTrackerRateRepository.find({
      where: { isActive: true },
      relations: ['user'],
    });

    const rateMap = new Map<string, number>();

    for (const rate of rates) {
      for (const trackerUid of rate.user.trackerUid) {
        const rateValue = Number(rate.rate);

        if (rate.type === EUserTrackerRateType.PROJECT && rate.contextValue) {
          // Ключ для поиска по проекту: userId:project:projectId
          const projectKey = `${trackerUid}:project:${rate.contextValue}`;
          rateMap.set(projectKey, rateValue);
        } else if (rate.type === EUserTrackerRateType.QUEUE && rate.contextValue) {
          // Ключ для поиска по очереди: userId:queue:queueKey
          const queueKey = `${trackerUid}:queue:${rate.contextValue}`;
          rateMap.set(queueKey, rateValue);
        } else if (rate.type === EUserTrackerRateType.GLOBAL) {
          // Ключ для глобальной ставки: userId:global
          const globalKey = `${trackerUid}:global`;
          rateMap.set(globalKey, rateValue);
        }
      }
    }

    this.logger.debug(`Created rate map with ${rateMap.size} entries from ${rates.length} rates`);
    return rateMap;
  }

  /**
   * Batch update salaries by creating new rate records for multiple employees.
   * @param batchData - Array of rate changes to process
   * @returns Promise that resolves to array of results for each employee
   */
  async batchUpdateRates(batchData: IBatchRateUpdate): Promise<IServiceResult<IBatchRateUpdateResult[]>> {
    this.logger.log(`Starting batch rate update for ${batchData.changes.length} employees`);

    return this.userTrackerRateRepository.manager.transaction(async (manager) => {
      const results: IBatchRateUpdateResult[] = [];
      let successCount = 0;
      let errorCount = 0;

      for (const change of batchData.changes) {
        try {
          // Check if user exists
          const user = await this.userTrackerRepository.findOne({
            where: { id: change.userId },
          });

          if (!user) {
            this.logger.warn(`User with id ${change.userId} not found`);
            results.push({
              userId: change.userId,
              success: false,
              error: `User with id ${change.userId} not found`,
            });
            errorCount++;
            continue;
          }

          // Find and deactivate existing active rate for the same context
          const whereCondition: Partial<UserTrackerRateEntity> = {
            userId: user.id,
            type: change.type,
            isActive: true,
          };

          if (change.type === EUserTrackerRateType.PROJECT || change.type === EUserTrackerRateType.QUEUE) {
            whereCondition.contextValue = change.contextValue;
          }

          const existingRate = await manager.findOne(UserTrackerRateEntity, { where: whereCondition });

          if (existingRate) {
            await manager.update(UserTrackerRateEntity, { id: existingRate.id }, { isActive: false });
            this.logger.log(
              `Deactivated existing rate ${existingRate.id} for user ${user.id}, type: ${change.type}, context: ${change.contextValue || 'null'}`,
            );
          }

          // Create new rate
          const userRateData: ICreateUserTrackerRate = {
            userId: change.userId,
            rate: change.rate,
            comment: change.comment,
            type: change.type,
            contextValue: change.contextValue,
          };

          const newRate = manager.create(UserTrackerRateEntity, {
            ...userRateData,
            isActive: true,
          });

          const savedRate = await manager.save(newRate);
          this.logger.log(`Rate updated successfully for user ${change.userId}: ${change.rate} RUB/hour`);

          results.push({
            userId: change.userId,
            success: true,
            rateId: savedRate.id,
          });
          successCount++;
        } catch (error) {
          this.logger.error(`Failed to update rate for user ${change.userId}:`, error);
          results.push({
            userId: change.userId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
          });
          errorCount++;
        }
      }

      this.logger.log(`Batch rate update completed: ${successCount} successful, ${errorCount} failed`);

      return {
        success: true,
        data: results,
      };
    });
  }

  /**
   * Finds the most specific rate for a user based on project and queue context.
   * Priority: project rate > queue rate > global rate
   * @param userId - The user's ID
   * @param projectId - Optional project ID
   * @param queueKey - Optional queue key
   * @returns The most specific rate or 0 if no rate found
   */
  async findRateForUser(userId: string, projectId?: string, queueKey?: string): Promise<number> {
    // 1. Try to find project-specific rate
    if (projectId) {
      const projectRate = await this.userTrackerRateRepository.findOne({
        where: {
          userId,
          type: EUserTrackerRateType.PROJECT,
          contextValue: projectId,
          isActive: true,
        },
        order: { createdAt: 'DESC' },
      });
      if (projectRate) {
        this.logger.debug(`Found project rate for user ${userId}, project ${projectId}: ${projectRate.rate}`);
        return Number(projectRate.rate);
      }
    }

    // 2. Try to find queue-specific rate
    if (queueKey) {
      const queueRate = await this.userTrackerRateRepository.findOne({
        where: {
          userId,
          type: EUserTrackerRateType.QUEUE,
          contextValue: queueKey,
          isActive: true,
        },
        order: { createdAt: 'DESC' },
      });
      if (queueRate) {
        this.logger.debug(`Found queue rate for user ${userId}, queue ${queueKey}: ${queueRate.rate}`);
        return Number(queueRate.rate);
      }
    }

    // 3. Fall back to global rate
    const globalRate = await this.userTrackerRateRepository.findOne({
      where: {
        userId,
        type: EUserTrackerRateType.GLOBAL,
        isActive: true,
      },
      order: { createdAt: 'DESC' },
    });

    if (globalRate) {
      this.logger.debug(`Found global rate for user ${userId}: ${globalRate.rate}`);
      return Number(globalRate.rate);
    }

    this.logger.warn(`No rate found for user ${userId}`);
    return 0;
  }

  /**
   * Helper method to find rate from pre-loaded rate map with priority support.
   * Priority: project rate > queue rate > global rate
   * @param rateMap - Pre-loaded map of rates
   * @param userId - The user's tracker ID
   * @param projectId - Optional project ID
   * @param queueKey - Optional queue key
   * @returns The most specific rate or 0 if no rate found
   */
  static findRateFromMap(rateMap: Map<string, number>, userId: string, projectId?: string, queueKey?: string): number {
    // 1. Try project-specific rate first
    if (projectId) {
      const projectKey = `${userId}:project:${projectId}`;
      const projectRate = rateMap.get(projectKey);
      if (projectRate !== undefined) {
        return projectRate;
      }
    }

    // 2. Try queue-specific rate
    if (queueKey) {
      const queueKeyStr = `${userId}:queue:${queueKey}`;
      const queueRate = rateMap.get(queueKeyStr);
      if (queueRate !== undefined) {
        return queueRate;
      }
    }

    // 3. Fall back to global rate
    const globalKey = `${userId}:global`;
    const globalRate = rateMap.get(globalKey);
    console.log(`Global rate for user ${userId}: ${globalRate}`);
    if (globalRate !== undefined) {
      return globalRate;
    }

    return 0;
  }
}
