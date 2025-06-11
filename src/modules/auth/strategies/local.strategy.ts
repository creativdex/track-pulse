import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { IAuthedUser } from '../models/auth.model';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
    super({ usernameField: 'login' });
  }

  /**
   * Validates user credentials and returns user data
   * @param login User login
   * @param password User password
   * @returns User data if credentials are valid
   * @throws UnauthorizedException if credentials are invalid
   */
  async validate(login: string, password: string): Promise<IAuthedUser> {
    const result = await this.authService.validateUser({ login, password });
    if (!result.success) {
      throw new UnauthorizedException('Invalid login or password');
    }

    return result.data;
  }
}
