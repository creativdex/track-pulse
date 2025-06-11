import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ERoleUser } from '@src/shared/access/roles/role.enum';
import { roleHierarchy } from '@src/shared/access/roles/role.priority';
import { IAuthedUserRequest } from '../../../modules/auth/models/auth.model';
import { ROLES_KEY } from '../roles/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<ERoleUser[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<IAuthedUserRequest>();

    if (!user) {
      throw new UnauthorizedException('User is not authenticated');
    }

    const userRoleLevel = roleHierarchy[user.role as ERoleUser] || 0;
    const requiredLevel = Math.max(...requiredRoles.map((role) => roleHierarchy[role] || 0));

    if (userRoleLevel >= requiredLevel) {
      return true;
    }

    throw new ForbiddenException(`User doesn't have required role: ${requiredRoles.join(', ')}`);
  }
}
