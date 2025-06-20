import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserTrackerRateEntity } from './user-rate.entity';
import { Repository } from 'typeorm';
import { ICreateUserTrackerRate } from './models/create-user-rate.model';
import { IServiceResult } from '@src/shared/types/service-result.type';
import { IUserTrackerRate } from './models/user-rate.model';
import { UserTrackerEntity } from '../user/user.entity';
import { IBatchRateUpdate } from './models/batch-rate-update.model';
import { IBatchRateUpdateResult } from './models/batch-rate-update-result.model';

@Injectable()
export class UserTrackerRateService {
  protected readonly logger = new Logger(UserTrackerRateService.name);

  constructor(
    @InjectRepository(UserTrackerRateEntity)
    private readonly userRateRepository: Repository<UserTrackerRateEntity>,
    @InjectRepository(UserTrackerEntity)
    private readonly userRepository: Repository<UserTrackerEntity>,
  ) {}

  /**
   * Creates a new user rate.
   * @param userRateData - The data for the user rate to be created.
   * @returns A promise that resolves to the created user rate or an error message.
   */
  async create(userRateData: ICreateUserTrackerRate): Promise<IServiceResult<IUserTrackerRate>> {
    const user = await this.userRepository.findOne({ where: { id: userRateData.userId } });
    if (!user) {
      this.logger.warn(`User with id ${userRateData.userId} not found`);
      return {
        success: false,
        error: `User with id ${userRateData.userId} not found`,
      };
    }

    const userRate = this.userRateRepository.create(userRateData);
    await this.userRateRepository.save(userRate);

    this.logger.log(`User rate created successfully for user id ${userRateData.userId}`);
    return {
      success: true,
      data: userRate,
    };
  }

  /**
   * Batch update salaries by creating new rate records for multiple employees.
   * @param batchData - Array of rate changes to process
   * @returns Promise that resolves to array of results for each employee
   */
  async batchUpdateRates(batchData: IBatchRateUpdate): Promise<IServiceResult<IBatchRateUpdateResult[]>> {
    this.logger.log(`Starting batch rate update for ${batchData.changes.length} employees`);

    const results: IBatchRateUpdateResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const change of batchData.changes) {
      try {
        // Проверяем существование пользователя
        const user = await this.userRepository.findOne({
          where: { id: change.employeeId },
        });

        if (!user) {
          this.logger.warn(`User with id ${change.employeeId} not found`);
          results.push({
            employeeId: change.employeeId,
            success: false,
            error: `User with id ${change.employeeId} not found`,
          });
          errorCount++;
          continue;
        }

        // Создаем новую запись о ставке
        const userRateData: ICreateUserTrackerRate = {
          userId: change.employeeId,
          rate: change.newRate,
          comment: change.comment,
        };

        const userRate = this.userRateRepository.create(userRateData);
        const savedRate = await this.userRateRepository.save(userRate);

        this.logger.log(`Rate updated successfully for user ${change.employeeId}: ${change.newRate} RUB/hour`);

        results.push({
          employeeId: change.employeeId,
          success: true,
          rateId: savedRate.id,
        });
        successCount++;
      } catch (error) {
        this.logger.error(`Failed to update rate for user ${change.employeeId}:`, error);
        results.push({
          employeeId: change.employeeId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        });
        errorCount++;
      }
    }

    this.logger.log(`Batch rate update completed: ${successCount} successful, ${errorCount} failed`);

    // Возвращаем результат - всегда успешный, но с детализацией по каждому сотруднику
    return {
      success: true,
      data: results,
    };
  }
}
