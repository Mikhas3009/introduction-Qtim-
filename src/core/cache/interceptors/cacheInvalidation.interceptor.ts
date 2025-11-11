import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost, Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { RedisCacheService } from '../services/redisCache.service';
import { isSafeMethod } from '../helpers/isSafeMethod';
import { resolveInvalidationConfig } from '../helpers/resolveInvalidationConfig';
import { invalidateCache } from '../helpers/invalidateCache';

/**
 * Интерсептор инвалидации кэша.
 *
 * Для небезопасных HTTP-методов (POST/PUT/PATCH/DELETE) после успешного выполнения
 * хэндлера выполняет инвалидацию кэша:
 * 1) Читает конфиг из метаданных хэндлера/класса (см. {@link resolveInvalidationConfig}).
 * 2) Удаляет точечные ключи и ключи, подходящие под паттерны (см. {@link invalidateCache}).
 * 3) Добавляет в Кэш
 */

@Injectable()
export class CacheInvalidationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInvalidationInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly cache: RedisCacheService,
    private readonly httpAdapterHost?: HttpAdapterHost,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isHttp = !!context.switchToHttp().getRequest();
    if (!isHttp || isSafeMethod(context.switchToHttp().getRequest().method)) {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest();
    const httpAdapter = this.httpAdapterHost?.httpAdapter;

    return next.handle().pipe(
      tap(async (result) => {
        try {
          const cfg = await resolveInvalidationConfig(this.reflector, context);
          await invalidateCache(this.cache, cfg);

          const method = String(req.method || '').toUpperCase();

          if (method === 'DELETE') {
            return;
          }
          let keyToRebuild: string | undefined;

          if (!httpAdapter?.getRequestUrl) {
            return;
          }

          const currentUrl = String(httpAdapter.getRequestUrl(req) || '');

          if (!currentUrl) {
            return;
          }

          if (method === 'PATCH' || method === 'PUT') {
            keyToRebuild = currentUrl;
          } else if (method === 'POST') {
            const id = result?.id ?? result?.data?.id;
            if (id) {
              keyToRebuild = currentUrl.endsWith('/')
                ? `${currentUrl}${id}`
                : `${currentUrl}/${id}`;
            }
          }

          if (keyToRebuild && result !== undefined) {
            await this.cache.set(keyToRebuild, result);
          }
        } catch (err: any) {
          this.logger.warn(err);
        }
      }),
    );
  }
}
