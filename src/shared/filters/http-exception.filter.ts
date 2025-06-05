import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import { FastifyReply, FastifyRequest } from 'fastify';

interface Exception {
  status: number;
  message: string;
  url: string;
}

interface ZodExceptionData {
  status: number;
  message: string;
  url: string;
  data: unknown;
}

interface HttpExceptionData {
  status: number | null;
  message: string;
  url: string | null;
}

@Catch(HttpException, ZodValidationException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger(HttpExceptionFilter.name);
  }

  catch(exception: HttpException | ZodValidationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
    const status = exception.getStatus();
    const info = exception.getResponse() as Exception | string;

    let exceptionData: ZodExceptionData | HttpExceptionData;

    if (exception instanceof ZodValidationException) {
      const zodError = exception.getZodError();
      exceptionData = {
        status: exception.getStatus(),
        message: exception.message,
        url: request.url,
        data: zodError.errors,
      };
    } else {
      exceptionData = {
        status: typeof info === 'string' ? null : info?.status,
        message: typeof info === 'string' ? info : info?.message,
        url: typeof info === 'string' ? null : info?.url,
      };
    }
    const data = {
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
      exception: exceptionData,
    };
    this.logger.error({ message: exception.message, data: data });
    response.status(status).send(data);
  }
}
