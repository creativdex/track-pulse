import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { IServiceResult } from '@src/shared/types/service-result.type';
import * as bcrypt from 'bcrypt';
import { ICreateUserBody } from './models/create-user.model';
import { ERoleUser } from '@src/shared/access/roles/role.enum';
import { IUser } from './models/user.model';
import { IUpdateUserBody, IUpdateUserQuery } from './models/update-user.model';
import { IFindUserByIdQuery, IFindUserByLoginQuery } from './models/find-user.model';
import { IUpdatePasswordUserBody, IUpdatePasswordUserQuery } from './models/udpate-password-user.model';
import { IDeleteUserQuery } from './models/delete-user.model';
import { IActivateUserQuery } from './models/activate-user.model';

@Injectable()
export class UserService {
  protected readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(UserEntity)
    protected readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Creates a new user
   * @param payload User data for creation
   * @returns Service result with created user data
   */
  async createUser(payload: ICreateUserBody): Promise<IServiceResult<IUser>> {
    try {
      // Check if user with this login already exists
      const existingUser = await this.userRepository.findOne({
        where: { login: payload.login },
      });

      if (existingUser) {
        return { success: false, error: 'User with this login already exists' };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(payload.password, 10);

      // Create new user
      const newUser = this.userRepository.create({
        login: payload.login,
        password: hashedPassword,
        firstName: payload.firstName,
        lastName: payload.lastName,
        role: ERoleUser.VIEWER, // Default role
        isActive: false,
      });

      const savedUser = await this.userRepository.save(newUser);
      this.logger.debug(`User created: ${savedUser.login}`);

      return { success: true, data: this._mapToAuthedUser(savedUser) };
    } catch (error) {
      this.logger.error(`Error creating user: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error: 'Failed to create user' };
    }
  }

  /**
   * Finds a user by ID
   * @param payload Query containing user ID
   * @returns Service result with user data
   */
  async findById(payload: IFindUserByIdQuery): Promise<IServiceResult<IUser>> {
    try {
      const user = await this.userRepository.findOne({ where: { id: payload.id } });
      if (!user) {
        return { success: false, error: 'User not found' };
      }
      return { success: true, data: this._mapToAuthedUser(user) };
    } catch (error) {
      this.logger.error(`Error finding user by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error: 'Failed to find user' };
    }
  }

  /**
   * Finds a user by login
   * @param payload Query containing user login
   * @returns Service result with user data
   */
  async findByLogin(payload: IFindUserByLoginQuery): Promise<IServiceResult<IUser>> {
    try {
      const user = await this.userRepository.findOne({ where: { login: payload.login } });
      if (!user) {
        return { success: false, error: 'User not found' };
      }
      return { success: true, data: this._mapToAuthedUser(user) };
    } catch (error) {
      this.logger.error(`Error finding user by login: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error: 'Failed to find user' };
    }
  }

  /**
   * Updates user data
   * @param query Query containing user identifier
   * @param payload Data to update
   * @returns Service result with updated user data
   */
  async updateUser(query: IUpdateUserQuery, payload: IUpdateUserBody): Promise<IServiceResult<IUser>> {
    try {
      const user = await this.userRepository.findOne({ where: { id: query.id } });
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Update fields if provided
      if (payload.firstName !== undefined) user.firstName = payload.firstName;
      if (payload.lastName !== undefined) user.lastName = payload.lastName;
      if (payload.role !== undefined) user.role = payload.role;
      if (payload.isActive !== undefined) user.isActive = payload.isActive;

      const updatedUser = await this.userRepository.save(user);
      this.logger.debug(`User updated: ${updatedUser.login}`);

      return { success: true, data: this._mapToAuthedUser(updatedUser) };
    } catch (error) {
      this.logger.error(`Error updating user: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error: 'Failed to update user' };
    }
  }

  /**
   * Updates user password
   * @param query Query containing user identifier
   * @param payload New password data
   * @returns Service result indicating success or failure
   */
  async updatePassword(
    query: IUpdatePasswordUserQuery,
    payload: IUpdatePasswordUserBody,
  ): Promise<IServiceResult<void>> {
    try {
      const user = await this.userRepository.findOne({ where: { id: query.id } });
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const hashedPassword = await bcrypt.hash(payload.newPassword, 10);
      user.password = hashedPassword;
      user.refreshToken = ''; // Invalidate refresh token on password change

      await this.userRepository.save(user);
      this.logger.debug(`Password updated for user: ${user.login}`);

      return { success: true, data: undefined };
    } catch (error) {
      this.logger.error(`Error updating password: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error: 'Failed to update password' };
    }
  }

  /**
   * Deletes a user (soft delete by deactivating)
   * @param payload Query containing user identifier
   * @returns Service result indicating success or failure
   */
  async deleteUser(payload: IDeleteUserQuery): Promise<IServiceResult<void>> {
    try {
      const user = await this.userRepository.findOne({ where: { id: payload.id } });
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Soft delete by deactivating and clearing sensitive data
      user.isActive = false;
      user.refreshToken = '';

      await this.userRepository.save(user);
      this.logger.debug(`User deleted (deactivated): ${user.login}`);

      return { success: true, data: undefined };
    } catch (error) {
      this.logger.error(`Error deleting user: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error: 'Failed to delete user' };
    }
  }

  /**
   * Finds users requiring activation
   * Returns users that are inactive and have never logged in
   * @returns Service result with list of users requiring activation
   */
  async findUserRequiringActivation(): Promise<IServiceResult<IUser[]>> {
    const users = await this.userRepository.find({
      where: { isActive: false, lastLoginAt: IsNull() },
      order: { createdAt: 'DESC' },
    });

    if (users.length === 0) {
      return { success: true, data: [] };
    }

    const mappedUsers = users.map((user) => this._mapToAuthedUser(user));
    return { success: true, data: mappedUsers };
  }

  /**
   * Finds all users in the system
   * This method retrieves all users, regardless of their activation status.
   * @returns Service result with list of users
   */
  async findAllUser(): Promise<IServiceResult<IUser[]>> {
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });

    if (users.length === 0) {
      return { success: true, data: [] };
    }

    const mappedUsers = users.map((user) => this._mapToAuthedUser(user));
    return { success: true, data: mappedUsers };
  }

  /**
   * Activates a user account by ID
   * @param query Query containing user identifier
   * @returns Service result indicating success or failure
   */
  async activateUser(query: IActivateUserQuery): Promise<IServiceResult<void>> {
    const user = await this.userRepository.findOne({ where: { id: query.id } });
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    if (user.isActive) {
      return { success: false, error: 'User is already active' };
    }
    user.isActive = true;
    await this.userRepository.save(user);
    this.logger.debug(`User activated: ${user.login}`);
    return { success: true, data: undefined };
  }

  /**
   * Deactivates a user account by ID
   * @param query Query containing user identifier
   * @returns Service result indicating success or failure
   */
  async deactivateUser(query: IActivateUserQuery): Promise<IServiceResult<void>> {
    const user = await this.userRepository.findOne({ where: { id: query.id } });
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    if (!user.isActive) {
      return { success: false, error: 'User is already inactive' };
    }
    user.isActive = false;
    user.refreshToken = ''; // Invalidate refresh token on deactivation
    await this.userRepository.save(user);
    this.logger.debug(`User deactivated: ${user.login}`);
    return { success: true, data: undefined };
  }

  /**
   * Validates user password
   * @param id User identifier
   * @param password Password to validate
   * @returns Service result indicating if password is valid
   */
  async validatePassword(id: string, password: string): Promise<IServiceResult<boolean>> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const isValid = await bcrypt.compare(password, user.password);
      return { success: true, data: isValid };
    } catch (error) {
      this.logger.error(`Error validating password: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error: 'Failed to validate password' };
    }
  }

  /**
   * Updates user's refresh token and last login time
   * @param id User identifier
   * @param refreshToken New refresh token
   * @returns Service result indicating success or failure
   */
  async updateRefreshToken(id: string, refreshToken: string): Promise<IServiceResult<void>> {
    try {
      await this.userRepository.update(id, {
        refreshToken,
        lastLoginAt: new Date(),
      });
      return { success: true, data: undefined };
    } catch (error) {
      this.logger.error(`Error updating refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error: 'Failed to update refresh token' };
    }
  }

  /**
   * Maps database entity to IUser interface
   * @param user Database user entity
   * @returns Mapped user object
   */
  private _mapToAuthedUser(user: UserEntity): IUser {
    return {
      id: user.id,
      login: user.login,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
