import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { RedisCacheService } from '../services/redisCache.service';
import { isSafeMethod } from '../helpers/isSafeMethod';
import { resolveInvalidationConfig } from '../helpers/resolveInvalidationConfig';
import { invalidateCache } from '../helpers/invalidateCache';

@Injectable()
export class CacheInvalidationInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly cache: RedisCacheService,
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isHttp = !!context.switchToHttp().getRequest();
    if (!isHttp || isSafeMethod(context.switchToHttp().getRequest().method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        (async () => {
          const cfg = await resolveInvalidationConfig(this.reflector, context);
          await invalidateCache(this.cache, cfg);
        })();
      }),
    );
  }
}
