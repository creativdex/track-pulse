import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IAuthedUser, IAuthedUserRequest } from '@src/modules/auth/models/auth.model';

/**
 * Декоратор для получения данных текущего аутентифицированного пользователя
 * @example
 * // Получить все данные пользователя
 * @Get('profile')
 * getProfile(@CurrentUser() user: IAuthedUser) {
 *   return user;
 * }
 *
 * // Получить конкретное поле
 * @Get('user-id')
 * getUserId(@CurrentUser('id') userId: string) {
 *   return { userId };
 * }
 */
export const CurrentUser = createParamDecorator((data: keyof IAuthedUser | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<IAuthedUserRequest>();
  const user = request.user;

  if (!user) {
    throw new Error('No user found in the request. Ensure that the authentication guard is applied.');
  }

  if (data) {
    if (!(data in user)) {
      throw new Error(`Field "${data}" does not exist on the user object.`);
    }
    return user[data];
  }

  return user;
});
