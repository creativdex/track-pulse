import { SetMetadata } from '@nestjs/common';
import { ERoleUser } from './role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: ERoleUser[]) => SetMetadata(ROLES_KEY, roles);
