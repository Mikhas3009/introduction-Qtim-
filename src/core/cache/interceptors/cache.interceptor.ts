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
    if (!key) return next.handle();

    try {
      const cached = await this.cache.get(key);
      setCacheHeader(context, this.httpAdapterHost, cached);
      if (cached !== undefined) return of(cached);

      const ttl = await resolveTTL(context, this.reflector, this.logger);
      return next.handle().pipe(
        tap(async (response) => {
          try {
            if (response !== undefined)
              await this.cache.set(key, response, ttl);
          } catch (e: any) {
            this.logger.warn(
              `Failed to set cache for key "${key}": ${e?.message ?? e}`,
            );
          }
        }),
      );
    } catch (e: any) {
      this.logger.error(`Cache error for key "${key}": ${e?.message ?? e}`);
      return next.handle();
    }
  }
}
