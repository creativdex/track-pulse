import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRateEntity } from './user-rate.entity';
import { Repository } from 'typeorm';
import { ICreateUserRate } from './models/create-user-rate.model';
import { IServiceResult } from '@src/shared/types/service-result.type';
import { IUserRate } from './models/user-rate.model';
import { UserEntity } from '../user/user.entity';

@Injectable()
export class UserRateService {
  protected readonly logger = new Logger(UserRateService.name);

  constructor(
    @InjectRepository(UserRateEntity)
    private readonly userRateRepository: Repository<UserRateEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(userRateData: ICreateUserRate): Promise<IServiceResult<IUserRate>> {
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
