import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtConfigFactory = (configService: ConfigService): JwtModuleOptions => ({
  secret: configService.get<string>('SECRET__JWT_KEY'),
  signOptions: {
    expiresIn: configService.get<string | number>('ENV__JWT_EXPIRES_IN', '3d'),
  },
});
