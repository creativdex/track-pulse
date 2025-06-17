import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { IUser } from '../../user/models/user.model';
import { ITokenAuthData } from '../models/auth.model';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    protected readonly configService: ConfigService,
    protected readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('SECRET__JWT_ACCESS_KEY'),
    });
  }

  /**
   * Validates JWT payload and returns user information
   * @param payload Decoded JWT payload
   * @returns User data for request object
   */
  async validate(payload: ITokenAuthData): Promise<IUser> {
    const result = await this.authService.validateJwtToken(payload.sub);

    if (!result.success) {
      throw new UnauthorizedException(result.error || 'Unauthorized');
    }

    return result.data;
  }
}
