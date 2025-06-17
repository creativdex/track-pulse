import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import { FastifyReply, FastifyRequest } from 'fastify';

interface ResponseData {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string;
  errors?: any[];
  details?: Record<string, any>;
}

@Catch(HttpException, ZodValidationException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException | ZodValidationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
    const status = exception.getStatus();
    const info = exception.getResponse();

    const responseData: ResponseData = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
    };

    // Добавляем дополнительные данные в зависимости от типа исключения
    if (exception instanceof ZodValidationException) {
      responseData.errors = exception.getZodError().errors;
    } else if (typeof info === 'object' && info !== null) {
      // Добавляем любые дополнительные поля из объекта ответа
      const responseInfo = info as Record<string, any>;
      const additionalInfo = { ...responseInfo };

      if ('message' in additionalInfo) {
        delete additionalInfo.message;
      }
      if (Object.keys(additionalInfo).length > 0) {
        responseData.details = additionalInfo;
      }
    }

    this.logger.error(`Exception: ${exception.message}`, responseData);
    response.status(status).send(responseData);
  }
}
