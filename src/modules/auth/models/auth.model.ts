import { FastifyRequest } from 'fastify';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { IUser } from '../../user/models/user.model';

/**
 * JWT Token payload model
 * Contains minimal user information for token security
 */
export const tokenAuthDataModel = z.object({
  sub: z.string().uuid(),
  login: z.string().min(3, 'Login is required'),
  role: z.string(),
});

export type ITokenAuthData = z.infer<typeof tokenAuthDataModel>;

/**
 * Request interface with authenticated user
 * Used by guards and decorators to access user data
 */
export interface IAuthedUserRequest extends FastifyRequest {
  user: IUser;
}

export class TokenAuthDataDto extends createZodDto(tokenAuthDataModel) {}
