import {
  ExecutionContext,
  applyDecorators,
  SetMetadata,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInvalidationInterceptor } from 'src/core/cache/interceptors/cacheInvalidation.interceptor';
import { generateArticleInvalidatePatterns } from '../helpers/generateArticleInvalidatePatterns.helper';

/**
 * Декоратор класса/метода, который включает инвалидацию кэша статей
 * после успешного выполнения хэндлеров (PATCH/DELETE).
 *
 * @returns {ClassDecorator & MethodDecorator}
 * Декоратор, который можно навесить на класс контроллера или на отдельный хэндлер.
 *
 * @example
 * // На всём контроллере: инвалидация сработает для всех мутаций внутри
 * @InvalidateArticleCache()
 * @Controller('articles')
 * export class ArticlesController { ... }
 *
 */
export const InvalidateArticleCache = () => {
  const input = (context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const { id } = request.params ?? {};
    return {
      patterns: generateArticleInvalidatePatterns({
        id,
      }),
    };
  };

  return applyDecorators(
    SetMetadata('cache_invalidate_key', input),
    UseInterceptors(CacheInvalidationInterceptor),
  );
};
