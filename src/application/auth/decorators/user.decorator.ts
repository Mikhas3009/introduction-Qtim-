import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { IAuthUser } from 'src/core/interfaces/IAuthUser.interface';

/**
 * Параметр-декоратор `@User()` для извлечения текущего пользователя из запроса.
 * @returns {IAuthUser | undefined} Текущий пользователь или `undefined`
 *
 *
 * @remarks
 * - Обязательное использование JwtGuard
 */
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request['user'] as IAuthUser;
  },
);
