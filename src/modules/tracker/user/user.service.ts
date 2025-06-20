import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw } from 'typeorm';
import { UserTrackerEntity } from './user.entity';
import { IUserTracker } from './models/user.model';
import { IServiceResult } from '@src/shared/types/service-result.type';
import { ICreateUserTracker } from './models/create-user.model';
import { IUpdateUserTracker } from './models/update-user.model';

@Injectable()
export class UserTrackerService {
  protected readonly logger = new Logger(UserTrackerService.name);

  constructor(
    @InjectRepository(UserTrackerEntity)
    private readonly userRepository: Repository<UserTrackerEntity>,
  ) {}

  /**
   * Fetches all users from the database.
   * @param includeDismissed - Whether to include dismissed users (default: false).
   * @returns A promise that resolves to an array of users or an error message.
   */
  async findAll(includeDismissed: boolean = false): Promise<IServiceResult<IUserTracker[]>> {
    this.logger.log(`Fetching all users with includeDismissed=${includeDismissed}`);

    const whereCondition = includeDismissed ? {} : { dismissed: false };
    const users = await this.userRepository.find({
      where: whereCondition,
      relations: ['rates'],
    });

    this.logger.log(`Found ${users.length} users`);
    return {
      success: true,
      data: users.map(({ rates, ...user }) => ({ ...user, rate: this.lastRate(rates) })),
    };
  }

  /**
   * Fetches a user by their ID.
   * @param id - The ID of the user to fetch.
   * @returns A promise that resolves to the user or an error message.
   */
  async findById(id: string): Promise<IServiceResult<IUserTracker>> {
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
    const { rates, ...userData } = user;
    return {
      success: true,
      data: { ...userData, rate: this.lastRate(rates) },
    };
  }

  /**
   * Fetches a user by their tracker UID.
   * @param trackerUid - The tracker UID of the user to fetch.
   * @returns A promise that resolves to the user or an error message.
   */
  async findByTrackerUid(trackerUid: string): Promise<IServiceResult<IUserTracker>> {
    this.logger.log(`Fetching user with trackerUid ${trackerUid}`);
    // Корректный поиск по массиву trackerUid через TypeORM Raw
    const user = await this.userRepository.findOne({
      where: {
        trackerUid: Raw((alias) => `ARRAY[${trackerUid}]::bigint[] && ${alias}`),
      },
      relations: ['rates'],
    });
    if (!user) {
      this.logger.warn(`User with trackerUid ${trackerUid} not found`);
      return {
        success: false,
        error: `User with trackerUid ${trackerUid} not found`,
      };
    }
    this.logger.log(`User with trackerUid ${trackerUid} found`);
    const { rates, ...userData } = user;
    return {
      success: true,
      data: { ...userData, rate: this.lastRate(rates) },
    };
  }

  /**
   * Fetches a user by their login.
   * @param login - The login of the user to fetch.
   * @returns A promise that resolves to the user or an error message.
   */
  async findByLogin(login: string): Promise<IServiceResult<IUserTracker>> {
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
    const { rates, ...userData } = user;
    return {
      success: true,
      data: { ...userData, rate: this.lastRate(rates) },
    };
  }

  /**
   * Creates a new user.
   * @param createData - The data for the user to be created.
   * @returns A promise that resolves to the created user or an error message.
   */
  async create(createData: ICreateUserTracker): Promise<IServiceResult<IUserTracker>> {
    this.logger.log(`Creating user with login ${createData.login}`);
    const existingUser = await this.userRepository.findOne({
      where: [{ email: createData.email }, { login: createData.login }],
    });

    if (existingUser) {
      this.logger.warn(`User with email ${createData.email} or login ${createData.login} already exists`);
      return {
        success: false,
        error: 'User with this email or login already exists',
      };
    }

    const userData = {
      trackerUid: [createData.trackerUid],
      display: createData.display,
      email: createData.email,
      login: createData.login,
      roles: createData.roles,
      dismissed: createData.dismissed,
    };

    const user = this.userRepository.create(userData);
    await this.userRepository.save(user);
    this.logger.log(`User with login ${createData.login} created successfully`);
    const { rates, ...userDataCreated } = user;
    return {
      success: true,
      data: { ...userDataCreated, rate: this.lastRate(rates) },
    };
  }

  /**
   * Updates an existing user.
   * @param id - The ID of the user to update.
   * @param updateData - The data to update the user with.
   * @returns A promise that resolves to the updated user or an error message.
   */
  async update(id: string, updateData: IUpdateUserTracker): Promise<IServiceResult<IUserTracker>> {
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
    const { rates, ...userDataUpdated } = updatedUser;
    return {
      success: true,
      data: { ...userDataUpdated, rate: this.lastRate(rates) },
    };
  }

  /**
   * Deletes a user by their ID.
   * @param id - The ID of the user to delete.
   * @returns A promise that resolves when the user is deleted.
   */
  async delete(id: string): Promise<void> {
    this.logger.log(`Deleting user with id ${id}`);
    await this.userRepository.delete(id);
    this.logger.log(`User with id ${id} deleted successfully`);
  }

  /**
   * Retrieves the last rate from the user's rates.
   * @param rates - The rates of the user.
   * @returns The last rate or null if no rates exist.
   */
  private lastRate(rates: UserTrackerEntity['rates']): number | null {
    if (!rates || rates.length === 0) {
      return null;
    }
    let last = rates[0];
    for (const rate of rates) {
      if (rate.createdAt > last.createdAt) {
        last = rate;
      }
    }
    this.logger.log(`Last rate for user is ${last.rate}`);
    return last.rate;
  }
}
