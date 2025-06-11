import { ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { ERoleUser } from '../roles/role.enum';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { applyDecorators, UseGuards } from '@nestjs/common';
import { EGuardType } from '../guard-type.enum';

/**
 * Universal decorator for applying authentication guards in NestJS
 * @param type Type of guard to apply (API_KEY, JWT, or BOTH)
 * @param requiredRole Minimum required role for access (optional)
 * @returns Composition of decorators for NestJS
 */
export function ApplyGuard(type: EGuardType, requiredRole?: ERoleUser) {
  const decorators = [];
  const guards = [];

  // API Key
  if (type === EGuardType.API_KEY || type === EGuardType.BOTH) {
    guards.push(ApiKeyGuard);
    decorators.push(
      ApiHeader({
        name: 'x-api-key',
        description: 'API Key для аутентификации',
        required: true,
        schema: {
          type: 'string',
        },
      }),
    );
  }

  // JWT
  if (type === EGuardType.JWT || type === EGuardType.BOTH) {
    guards.push(JwtAuthGuard);
    decorators.push(ApiBearerAuth());

    // Если указана требуемая роль
    if (requiredRole) {
      guards.push(RolesGuard);
      // Передаем одну роль вместо массива
      decorators.push(Roles(requiredRole));
    }
  }

  decorators.push(UseGuards(...guards));

  return applyDecorators(...decorators);
}
