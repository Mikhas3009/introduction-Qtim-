import { CACHE_TTL_METADATA } from '@nestjs/cache-manager';
import { ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isFunction } from '@nestjs/common/utils/shared.utils';

/** Достаёт TTL (число, мс) из метаданных или фабрики */
export async function resolveTTL(
  context: ExecutionContext,
  reflector: Reflector,
  logger: Logger,
): Promise<number | undefined> {
  const ttlValueOrFactory = reflector.get(
    CACHE_TTL_METADATA,
    context.getHandler(),
  );

  if (!ttlValueOrFactory) {
    return undefined;
  }
  const result = isFunction(ttlValueOrFactory)
    ? await ttlValueOrFactory(context)
    : ttlValueOrFactory;

  if (typeof result === 'number') return result;
  logger.warn(`TTL должен быть числом (мс), получено: "${typeof result}"`);
  return undefined;
}
