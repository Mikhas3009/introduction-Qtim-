import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector, HttpAdapterHost } from '@nestjs/core';
import { Observable, of, tap } from 'rxjs';
import { RedisCacheService } from '../services/redisCache.service';
import { resolveTTL } from '../helpers/resolveTTL';
import { trackBy } from '../helpers/trackBy';
import { setCacheHeader } from '../helpers/setCacheHeader';

/**
 * Интерсептор кэширования ответов (Redis).
 *
 * Алгоритм:
 * 1) Строит ключ кэша через {@link trackBy} — приоритет у @CacheKey, иначе URL
 * 2) Пытается прочитать значение из кэша:
 *    - если найдено — проставляет заголовок `X-Cache: HIT` и немедленно отдаёт кэш.
 *    - если нет — `X-Cache: MISS`, пропускает выполнение хэндлера, а затем
 *      сохраняет ответ в кэш с TTL из {@link resolveTTL}.
 * 3) Любые ошибки работы с кэшем НЕ валят запрос.
 *
 */
@Injectable()
export class RedisCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RedisCacheInterceptor.name);
  constructor(
    private readonly reflector: Reflector,
    private readonly cache: RedisCacheService,
    private readonly httpAdapterHost?: HttpAdapterHost,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const key = trackBy(context, this.reflector, this.httpAdapterHost);

    if (!key) {
      return next.handle();
    }
    try {
      const cached = await this.cache.get(key);
      setCacheHeader(context, this.httpAdapterHost, cached);
      if (cached !== undefined) {
        return of(cached);
      }
      const ttl = await resolveTTL(context, this.reflector);
      return next.handle().pipe(
        tap(async (response) => {
          try {
            if (response !== undefined)
              await this.cache.set(key, response, ttl);
          } catch (err: any) {
            this.logger.warn(
              `Failed to set cache for key "${key}": ${err?.message ?? err}`,
            );
          }
        }),
      );
    } catch (err: any) {
      this.logger.warn(err);
      return next.handle();
    }
  }
}
