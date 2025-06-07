import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { IUser } from './models/user.model';
import { IServiceResult } from '@src/shared/types/service-result.type';
import { ICreateUser } from './models/create-user.model';
import { IUpdateUser } from './models/update-user.model';

@Injectable()
export class UserService {
  protected readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findAll(): Promise<IServiceResult<IUser[]>> {
    this.logger.log('Fetching all users');
    const users = await this.userRepository.find();
    return {
      success: true,
      data: users.map((user) => ({ ...user, rate: this.lastRate(user.rates) })),
    };
  }

  async findById(id: string): Promise<IServiceResult<IUser>> {
    this.logger.log(`Fetching user with id ${id}`);
    const user = await this.userRepository.findOne({ where: { id }, relations: ['rates'] });
    if (!user) {
      this.logger.warn(`User with id ${id} not found`);
      return {
        success: false,
        error: `User with id ${id} not found`,
      };
    }
    this.logger.log(`User with id ${id} found`);
    return {
      success: true,
      data: { ...user, rate: this.lastRate(user.rates) },
    };
  }

  async findByTrackerUid(trackerUid: string): Promise<IServiceResult<IUser>> {
    this.logger.log(`Fetching user with trackerUid ${trackerUid}`);
    const user = await this.userRepository.findOne({ where: { trackerUid }, relations: ['rates'] });
    if (!user) {
      this.logger.warn(`User with trackerUid ${trackerUid} not found`);
      return {
        success: false,
        error: `User with trackerUid ${trackerUid} not found`,
      };
    }
    this.logger.log(`User with trackerUid ${trackerUid} found`);
    return {
      success: true,
      data: { ...user, rate: this.lastRate(user.rates) },
    };
  }

  async findByLogin(login: string): Promise<IServiceResult<IUser>> {
    this.logger.log(`Fetching user with login ${login}`);
    const user = await this.userRepository.findOne({ where: { login }, relations: ['rates'] });
    if (!user) {
      this.logger.warn(`User with login ${login} not found`);
      return {
        success: false,
        error: `User with login ${login} not found`,
      };
    }
    this.logger.log(`User with login ${login} found`);
    return {
      success: true,
      data: { ...user, rate: this.lastRate(user.rates) },
    };
  }

  async create(userData: ICreateUser): Promise<IServiceResult<IUser>> {
    this.logger.log(`Creating user with login ${userData.login}`);
    const existingUser = await this.userRepository.findOne({
      where: [{ trackerUid: userData.trackerUid }, { email: userData.email }, { login: userData.login }],
    });
    if (existingUser) {
      this.logger.warn(`User with login ${userData.login} already exists`);
      return {
        success: false,
        error: 'User with the same trackerUid, email, or login already exists',
      };
    }
    const user = this.userRepository.create(userData);
    await this.userRepository.save(user);
    this.logger.log(`User with login ${userData.login} created successfully`);
    return {
      success: true,
      data: { ...user, rate: this.lastRate(user.rates) },
    };
  }

  async update(id: string, updateData: IUpdateUser): Promise<IServiceResult<IUser>> {
    this.logger.log(`Updating user with id ${id}`);
    const existingUserResult = await this.findById(id);
    if (!existingUserResult.success) {
      this.logger.warn(`User with id ${id} not found for update`);
      return {
        success: false,
        error: `User with id ${id} not found`,
      };
    }
    await this.userRepository.update(id, updateData);
    const updatedUser = await this.userRepository.findOne({ where: { id }, relations: ['rates'] });
    if (!updatedUser) {
      this.logger.warn(`User with id ${id} not found after update`);
      return {
        success: false,
        error: `User with id ${id} not found after update`,
      };
    }
    this.logger.log(`User with id ${id} updated successfully`);
    return {
      success: true,
      data: { ...updatedUser, rate: this.lastRate(updatedUser.rates) },
    };
  }

  async delete(id: string): Promise<void> {
    this.logger.log(`Deleting user with id ${id}`);
    await this.userRepository.delete(id);
    this.logger.log(`User with id ${id} deleted successfully`);
  }

  private lastRate(rates: UserEntity['rates']): number | null {
    if (!rates || rates.length === 0) {
      return null;
    }
    let last = rates[0];
    for (const rate of rates) {
      if (rate.createdAt > last.createdAt) {
        last = rate;
      }
    }
    return last.rate;
  }
}
