import { CACHE_KEY_METADATA } from '@nestjs/cache-manager';
import { ExecutionContext } from '@nestjs/common';
import { Reflector, HttpAdapterHost } from '@nestjs/core';

/** Ключ кэша: @CacheKey или URL для безопасных методов */
export function trackBy(
  context: ExecutionContext,
  reflector: Reflector,
  httpAdapterHost: HttpAdapterHost | undefined,
  allowedMethods: string[] = ['GET'],
): string | undefined {
  const httpAdapter = httpAdapterHost?.httpAdapter;
  const isHttpApp = httpAdapter && !!httpAdapter.getRequestMethod;

  const cacheKey: string | undefined = reflector.get(
    CACHE_KEY_METADATA,
    context.getHandler(),
  );
  if (cacheKey) return cacheKey;

  if (!isHttpApp) return undefined;
  const request = context.switchToHttp().getRequest();
  return allowedMethods.includes(request.method)
    ? String(httpAdapter.getRequestUrl(request))
    : undefined;
}
