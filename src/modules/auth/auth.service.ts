import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthEntity } from './auth.entity';
import { ILoginAuth, ILoginAuthedUser } from './models/login-auth.model';
import { IServiceResult } from '@src/shared/types/service-result.type';
import { IAuthedUser, ITokenAuthData } from './models/auth.model';
import { IRegisterAuth } from './models/register-auth.model';
import { ERoleUser } from '@src/shared/access/roles/role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AuthEntity)
    private authRepository: Repository<AuthEntity>,
    private jwtService: JwtService,
  ) {}

  /**
   * Validates user credentials during authentication process
   * @param data Object containing login and password
   * @returns Service result with user data or error message
   */
  async validateUser(data: ILoginAuth): Promise<IServiceResult<IAuthedUser>> {
    const user = await this.authRepository.findOne({
      where: { login: data.login },
    });

    if (!user || !user.isActive) {
      return { success: false, error: 'User not found or inactive' };
    }

    if (await bcrypt.compare(data.password, user.password)) {
      return {
        success: true,
        data: this._mapToAuthedUser(user),
      };
    }

    return { success: false, error: 'Invalid credentials' };
  }

  /**
   * Authenticates user and issues access and refresh tokens
   * @param data Object containing login and password
   * @returns Service result with tokens and user information
   */
  async login(data: ILoginAuth): Promise<IServiceResult<ILoginAuthedUser>> {
    const userResult = await this.validateUser(data);
    if (!userResult.success) {
      return {
        success: false,
        error: userResult.error || 'Authentication failed',
      };
    }

    const loginAuthedUser = await this._createTokenAndUpdateUser(userResult.data);
    return { success: true, data: loginAuthedUser };
  }

  /**
   * Refreshes access token using a valid refresh token
   * @param token Valid refresh token
   * @returns Service result with new tokens and user information
   */
  async refreshToken(token: string): Promise<IServiceResult<ILoginAuthedUser>> {
    try {
      const decoded: ITokenAuthData = this.jwtService.verify(token);

      const user = await this.authRepository.findOne({ where: { id: decoded.sub } });

      if (!user || !user.isActive) {
        return { success: false, error: 'User not found or inactive' };
      }

      if (user.refreshToken !== token) {
        return { success: false, error: 'Invalid refresh token' };
      }

      const authedUser = this._mapToAuthedUser(user);
      const loginAuthedUser = await this._createTokenAndUpdateUser(authedUser);

      return { success: true, data: loginAuthedUser };
    } catch (error) {
      console.error('Token refresh error:', error);
      return { success: false, error: 'Invalid or expired token' };
    }
  }

  /**
   * Logs out a user by invalidating their refresh token
   * @param userId User identifier
   * @returns Service result indicating success or failure
   */
  async logout(userId: string): Promise<IServiceResult<void>> {
    try {
      await this.authRepository.update(userId, { refreshToken: '' });
      return { success: true, data: undefined };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Failed to logout' };
    }
  }

  /**
   * Registers a new user in the system
   * @param data Registration information
   * @returns Service result with created user data
   */
  async register(data: IRegisterAuth): Promise<IServiceResult<IAuthedUser>> {
    const existingUser = await this._findUserByLogin(data.login);
    if (existingUser.success) {
      return {
        success: false,
        error: 'User with this login already exists',
      };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newAuth = this.authRepository.create({
      login: data.login,
      password: hashedPassword,
      role: ERoleUser.VIEWER,
      isActive: false,
    });

    const savedAuth = await this.authRepository.save(newAuth);
    return {
      success: true,
      data: this._mapToAuthedUser(savedAuth),
    };
  }

  /**
   * Finds users requiring activation (new users)
   * @returns Service result with list of users requiring activation
   */
  async findUserRequiringActivation(): Promise<IServiceResult<IAuthedUser[]>> {
    const users = await this.authRepository.find({
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
   * Activates a user account by ID
   * @param id User identifier
   * @returns Service result indicating success or failure
   */
  async activateUser(id: string): Promise<IServiceResult<void>> {
    const user = await this.authRepository.findOne({ where: { id } });
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    if (user.isActive) {
      return { success: false, error: 'User is already active' };
    }
    user.isActive = true;
    await this.authRepository.save(user);
    return { success: true, data: undefined };
  }

  /**
   * Deactivates a user account by ID
   * @param id User identifier
   * @returns Service result indicating success or failure
   */
  async deactivateUser(id: string): Promise<IServiceResult<void>> {
    const user = await this.authRepository.findOne({ where: { id } });
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    if (!user.isActive) {
      return { success: false, error: 'User is already inactive' };
    }
    user.isActive = false;
    user.refreshToken = ''; // Invalidate refresh token on deactivation
    await this.authRepository.save(user);
    return { success: true, data: undefined };
  }

  /**
   * Finds a user by their ID
   * @param id User identifier
   * @returns Service result with user data
   */
  async findById(id: string): Promise<IServiceResult<IAuthedUser>> {
    return this._findUserById(id);
  }

  /**
   * Validates a user from JWT token data
   * @param userId User identifier from JWT token
   * @returns Service result with user data if valid
   */
  async validateJwtToken(userId: string): Promise<IServiceResult<IAuthedUser>> {
    const userResult = await this._findUserById(userId);
    if (!userResult.success || !userResult.data.isActive) {
      return {
        success: false,
        error: 'User not found or inactive',
      };
    }
    return userResult;
  }

  /**
   * Changes user password after validating current password
   * @param id User identifier
   * @param oldPassword Current password
   * @param newPassword New password to set
   * @returns Service result indicating success or failure
   */
  async changePassword(id: string, oldPassword: string, newPassword: string): Promise<IServiceResult<any>> {
    const user = await this.authRepository.findOne({ where: { id } });
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return { success: false, error: 'Invalid old password' };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.authRepository.update(id, { password: hashedPassword });

    return { success: true, data: 'Password changed successfully' };
  }

  /**
   * Maps database entity to authenticated user model
   * @param user Auth entity from database
   * @returns Mapped authenticated user object
   */
  private _mapToAuthedUser(user: AuthEntity): IAuthedUser {
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

  /**
   * Creates new tokens and updates user record in database
   * @param user Authenticated user data
   * @returns Login response with tokens and user information
   */
  private async _createTokenAndUpdateUser(user: IAuthedUser): Promise<ILoginAuthedUser> {
    const payload: ITokenAuthData = {
      sub: user.id,
      login: user.login,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.authRepository.update(user.id, {
      refreshToken,
      lastLoginAt: new Date(),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        login: user.login,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
      },
    };
  }

  /**
   * Finds a user by ID
   * @param id User identifier
   * @returns Service result with user data if found
   */
  private async _findUserById(id: string): Promise<IServiceResult<IAuthedUser>> {
    const user = await this.authRepository.findOne({ where: { id } });
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    return { success: true, data: this._mapToAuthedUser(user) };
  }

  /**
   * Finds a user by login
   * @param login User login
   * @returns Service result with user data if found
   */
  private async _findUserByLogin(login: string): Promise<IServiceResult<IAuthedUser>> {
    const user = await this.authRepository.findOne({ where: { login } });
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    return { success: true, data: this._mapToAuthedUser(user) };
  }
}
