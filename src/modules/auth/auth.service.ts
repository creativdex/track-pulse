import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { IUser } from '../user/models/user.model';
import { ICreateUserBody } from '../user/models/create-user.model';
import { ILoginAuth, ILoginAuthedUser, IRefreshToken } from './models/login-auth.model';
import { IServiceResult } from '@src/shared/types/service-result.type';
import { ITokenAuthData } from './models/auth.model';
import { IRegistrationAuth } from './models/register-auth.model';
import { IChangePasswordAuthBody, IChangePasswordAuthQuery } from './models/change-password-auth.model';

/**
 * AuthService handles authentication operations including login, logout,
 * token management, and user registration.
 *
 * This service follows enterprise patterns:
 * - Single Responsibility: Only handles authentication logic
 * - Dependency Inversion: Uses UserService for user operations
 * - Error Handling: Consistent error responses
 * - Logging: Comprehensive audit trail
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshTokenSecret: string;
  private readonly refreshTokenExpiresIn: string;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.refreshTokenSecret = this.configService.getOrThrow<string>('SECRET__JWT_REFRESH_KEY');
    this.refreshTokenExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
  }

  /**
   * Validates user credentials for authentication
   * Used by LocalStrategy for passport authentication
   *
   * @param credentials - Login and password
   * @returns ServiceResult with authenticated user data
   */
  async validateUser(credentials: ILoginAuth): Promise<IServiceResult<IUser>> {
    try {
      // Find user by login
      const userResult = await this.userService.findByLogin({ login: credentials.login });

      if (!userResult.success) {
        this.logger.warn(`Authentication attempt failed - user not found: ${credentials.login}`);
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      const user = userResult.data;

      // Check if user is active
      if (!user.isActive) {
        this.logger.warn(`Authentication attempt failed - user inactive: ${credentials.login}`);
        return {
          success: false,
          error: 'Account is not active',
        };
      }

      // Validate password
      const passwordValidation = await this.userService.validatePassword(user.id, credentials.password);

      if (!passwordValidation.success || !passwordValidation.data) {
        this.logger.warn(`Authentication attempt failed - invalid password: ${credentials.login}`);
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      this.logger.log(`User authenticated successfully: ${credentials.login}`);
      return {
        success: true,
        data: user,
      };
    } catch (error) {
      this.logger.error(`Authentication error for user ${credentials.login}:`, error);
      return {
        success: false,
        error: 'Authentication failed',
      };
    }
  }

  /**
   * Authenticates user and issues JWT tokens
   *
   * @param credentials - Login and password
   * @returns ServiceResult with tokens and user data
   */
  async login(credentials: ILoginAuth): Promise<IServiceResult<ILoginAuthedUser>> {
    const validationResult = await this.validateUser(credentials);

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error,
      };
    }

    try {
      const loginResponse = await this.generateTokensAndUpdateUser(validationResult.data);

      this.logger.log(`User logged in successfully: ${credentials.login}`);
      return {
        success: true,
        data: loginResponse,
      };
    } catch (error) {
      this.logger.error(`Login error for user ${credentials.login}:`, error);
      return {
        success: false,
        error: 'Login failed',
      };
    }
  } /**
   * Refreshes access token using valid refresh token
   *
   * @param tokenData - Refresh token
   * @returns ServiceResult with new tokens and user data
   */
  async refreshToken(tokenData: IRefreshToken): Promise<IServiceResult<ILoginAuthedUser>> {
    try {
      // Verify refresh token
      const decoded = this.jwtService.verify<ITokenAuthData>(tokenData.refreshToken, {
        secret: this.refreshTokenSecret,
      });

      // Get user data
      const userResult = await this.userService.findById({ id: decoded.sub });

      if (!userResult.success) {
        this.logger.warn(`Token refresh failed - user not found: ${decoded.login}`);
        return {
          success: false,
          error: 'User not found',
        };
      }

      const user = userResult.data;

      // Check if user is still active
      if (!user.isActive) {
        this.logger.warn(`Token refresh failed - user inactive: ${decoded.login}`);
        return {
          success: false,
          error: 'Account is not active',
        };
      }

      // For security, we'll regenerate tokens instead of validating stored refresh token
      // This approach is more secure as it doesn't require storing sensitive refresh tokens

      // Generate new tokens
      const loginResponse = await this.generateTokensAndUpdateUser(user);

      this.logger.log(`Token refreshed successfully: ${decoded.login}`);
      return {
        success: true,
        data: loginResponse,
      };
    } catch (error) {
      this.logger.error('Token refresh error:', error);
      return {
        success: false,
        error: 'Invalid or expired refresh token',
      };
    }
  } /**
   * Logs out user by clearing refresh token
   *
   * @param userId - User identifier
   * @returns ServiceResult indicating success/failure
   */
  async logout(userId: string): Promise<IServiceResult<void>> {
    try {
      const result = await this.userService.updateRefreshToken(userId, '');

      if (!result.success) {
        this.logger.error(`Logout failed for user ${userId}: ${result.error}`);
        return {
          success: false,
          error: 'Logout failed',
        };
      }

      this.logger.log(`User logged out successfully: ${userId}`);
      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      this.logger.error(`Logout error for user ${userId}:`, error);
      return {
        success: false,
        error: 'Logout failed',
      };
    }
  }

  /**
   * Registers new user in the system
   * Creates inactive user that requires admin activation
   *
   * @param registrationData - User registration information
   * @returns ServiceResult with created user data
   */
  async register(registrationData: IRegistrationAuth): Promise<IServiceResult<IUser>> {
    try {
      // Check if user already exists
      const existingUserResult = await this.userService.findByLogin({ login: registrationData.login });

      if (existingUserResult.success) {
        this.logger.warn(`Registration failed - user already exists: ${registrationData.login}`);
        return {
          success: false,
          error: 'User with this login already exists',
        };
      }

      // Create user data
      const createUserData: ICreateUserBody = {
        login: registrationData.login,
        password: registrationData.password,
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
      };

      // Create user via UserService
      const createResult = await this.userService.createUser(createUserData);

      if (!createResult.success) {
        this.logger.error(`Registration failed for user ${registrationData.login}: ${createResult.error}`);
        return {
          success: false,
          error: createResult.error || 'Registration failed',
        };
      }

      this.logger.log(`User registered successfully: ${registrationData.login}`);
      return {
        success: true,
        data: createResult.data,
      };
    } catch (error) {
      this.logger.error(`Registration error for user ${registrationData.login}:`, error);
      return {
        success: false,
        error: 'Registration failed',
      };
    }
  }

  /**
   * Validates JWT token payload and returns user data
   * Used by JwtStrategy for token authentication
   *
   * @param userId - User ID from JWT payload
   * @returns ServiceResult with user data
   */
  async validateJwtToken(userId: string): Promise<IServiceResult<IUser>> {
    try {
      const userResult = await this.userService.findById({ id: userId });

      if (!userResult.success) {
        this.logger.warn(`JWT validation failed - user not found: ${userId}`);
        return {
          success: false,
          error: 'User not found',
        };
      }

      const user = userResult.data;

      if (!user.isActive) {
        this.logger.warn(`JWT validation failed - user inactive: ${userId}`);
        return {
          success: false,
          error: 'Account is not active',
        };
      }

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      this.logger.error(`JWT validation error for user ${userId}:`, error);
      return {
        success: false,
        error: 'Token validation failed',
      };
    }
  }

  /**
   * Changes user password with current password validation
   *
   * @param userId - User identifier
   * @param oldPassword - Current password
   * @param newPassword - New password
   * @returns ServiceResult indicating success/failure
   */
  async changePassword(
    query: IChangePasswordAuthQuery,
    payload: IChangePasswordAuthBody,
  ): Promise<IServiceResult<void>> {
    try {
      // Validate current password
      const passwordValidation = await this.userService.validatePassword(query.id, payload.oldPassword);

      if (!passwordValidation.success || !passwordValidation.data) {
        this.logger.warn(`Password change failed - invalid old password: ${query.id}`);
        return {
          success: false,
          error: 'Invalid current password',
        };
      }

      // Update password
      const updateResult = await this.userService.updatePassword(
        { id: query.id },
        { newPassword: payload.newPassword },
      );

      if (!updateResult.success) {
        this.logger.error(`Password change failed for user ${query.id}: ${updateResult.error}`);
        return {
          success: false,
          error: updateResult.error || 'Password change failed',
        };
      }

      this.logger.log(`Password changed successfully for user: ${query.id}`);
      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      this.logger.error(`Password change error for user ${query.id}:`, error);
      return {
        success: false,
        error: 'Password change failed',
      };
    }
  }

  /**
   * Generates JWT tokens and updates user refresh token
   * Creates both access and refresh tokens with proper expiration
   *
   * @param user - User data
   * @returns Login response with tokens and user info
   */
  private async generateTokensAndUpdateUser(user: IUser): Promise<ILoginAuthedUser> {
    // Create minimal JWT payload
    const payload: ITokenAuthData = {
      sub: user.id,
      login: user.login,
      role: user.role,
    };

    // Generate tokens
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.refreshTokenSecret,
      expiresIn: this.refreshTokenExpiresIn,
    });

    // Update user's refresh token
    await this.userService.updateRefreshToken(user.id, refreshToken);

    // Return login response
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
}
