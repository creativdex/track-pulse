import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserTrackerRateEntity } from './user-rate.entity';
import { Repository } from 'typeorm';
import { ICreateUserTrackerRate } from './models/create-user-rate.model';
import { IServiceResult } from '@src/shared/types/service-result.type';
import { IUserTrackerRate } from './models/user-rate.model';
import { UserTrackerEntity } from '../user/user.entity';

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
}
