import { SetMetadata, applyDecorators, UseInterceptors } from '@nestjs/common';
import { CacheInvalidationInterceptor } from '../interceptors/cacheInvalidation.interceptor';

export const CACHE_INVALIDATE_KEY = 'cache_invalidate_key';

/** Инвалидация кэша после успешного выполнения обработчика */
export function InvalidateCache(
  input:
    | string[]
    | { keys?: string[]; patterns?: string[] }
    | ((...args: any[]) => any),
) {
  return applyDecorators(
    SetMetadata(CACHE_INVALIDATE_KEY, input),
    UseInterceptors(CacheInvalidationInterceptor),
  );
}
