import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IAuthedUserRequest } from '@src/modules/auth/models/auth.model';
import { IUser } from '@src/modules/user/models/user.model';

/**
 * Декоратор для получения данных текущего аутентифицированного пользователя
 * @example
 * // Получить все данные пользователя
 * @Get('profile')
 * getProfile(@CurrentUser() user: IUser) {
 *   return user;
 * }
 *
 * // Получить конкретное поле
 * @Get('user-id')
 * getUserId(@CurrentUser('id') userId: string) {
 *   return { userId };
 * }
 */
export const CurrentUser = createParamDecorator((data: keyof IUser | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<IAuthedUserRequest>();
  const user = request.user;

  if (!user) {
    throw new Error('No user found in the request. Ensure that the authentication guard is applied.');
  }

  if (data) {
    if (!(data in user)) {
      throw new Error(`Field "${String(data)}" does not exist on the user object.`);
    }
    return user[data];
  }

  return user;
});
