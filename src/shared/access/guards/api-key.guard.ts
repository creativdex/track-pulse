import { CanActivate, ExecutionContext, UnauthorizedException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyRequest } from 'fastify';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  protected readonly logger: Logger;

  constructor(protected readonly configService: ConfigService) {
    this.logger = new Logger(ApiKeyGuard.name);
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<FastifyRequest>();

    const { headers, ip } = req;

    const apiKeyHeader = headers['x-api-key'];

    this.logger.debug({
      message: 'ApiKey.authAttempted',
      data: { apiKeyHeader, ip },
    });

    if (!apiKeyHeader) {
      throw new UnauthorizedException('apiKey.notFound');
    }

    if (apiKeyHeader !== this.configService.getOrThrow<string>('SECRET__API_KEY')) {
      throw new UnauthorizedException('apiKey.notValid');
    }

    return true;
  }
}
