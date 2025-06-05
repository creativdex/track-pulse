import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { HttpErrorDto } from '@src/shared/schemas/http-error.schema';

export function ApiKeyRequired() {
  return applyDecorators(
    UseGuards(ApiKeyGuard),
    ApiHeader({
      name: 'x-api-key',
      description: '<x-api-key>',
      required: true,
      schema: {
        type: 'string',
      },
    }),
    ApiUnauthorizedResponse({
      type: HttpErrorDto,
      description: 'Error: Unauthorized',
    }),
  );
}
