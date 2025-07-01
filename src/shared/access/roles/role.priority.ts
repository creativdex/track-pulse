import { ERoleUser } from './role.enum';

export const roleHierarchy = {
  [ERoleUser.FATHER]: 200,
  [ERoleUser.ADMIN]: 100,
  [ERoleUser.VIEWER]: 50,
};
