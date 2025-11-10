import { applyDecorators, UseInterceptors, SetMetadata } from '@nestjs/common';
import { CACHE_TTL_METADATA } from '@nestjs/cache-manager';
import { RedisCacheInterceptor } from '../interceptors/cache.interceptor';

/** Кэширование ответа обработчика. TTL — число в миллисекундах или фабрика. */
export function Cache(
  ttl: number | ((...args: any[]) => number | Promise<number>),
) {
  return applyDecorators(
    SetMetadata(CACHE_TTL_METADATA, ttl),
    UseInterceptors(RedisCacheInterceptor),
  );
}
