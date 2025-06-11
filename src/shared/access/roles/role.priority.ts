import { ERoleUser } from './role.enum';

export const roleHierarchy = {
  [ERoleUser.ADMIN]: 100,
  [ERoleUser.VIEWER]: 50,
};
