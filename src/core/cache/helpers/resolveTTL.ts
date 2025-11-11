import { CACHE_TTL_METADATA } from '@nestjs/cache-manager';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isFunction } from '@nestjs/common/utils/shared.utils';

/**
 * Получает TTL кэширования (в миллисекундах) из метаданных хэндлера.
 *
 * Читает `CACHE_TTL_METADATA` (из `@nestjs/cache-manager`) на уровне **хэндлера**
 * и поддерживает два формата:
 * 1) `number` — TTL в миллисекундах
 * 2) `((ctx: ExecutionContext) => number | Promise<number>)` — фабрика TTL
 *
 * Если метаданные не заданы — возвращает `undefined`. Если результат не число —
 * логирует предупреждение и возвращает `undefined`.
 *
 * @param context  Текущий `ExecutionContext` (для фабрики TTL)
 * @param reflector Инъекция `Reflector` для чтения метаданных
 * @param logger    Логгер для предупреждений о неверном типе TTL
 * @returns {Promise<number | undefined>} TTL в миллисекундах или `undefined`
 *
 * @example
 * // Явное число
 * @SetMetadata(CACHE_TTL_METADATA, 30_000)
 * @Get('/items') list() {}
 *
 * @example
 * // Фабрика TTL (например, от роли пользователя)
 * @SetMetadata(CACHE_TTL_METADATA, async (ctx: ExecutionContext) => {
 *   const req = ctx.switchToHttp().getRequest();
 *   return req.user?.isAdmin ? 5_000 : 60_000;
 * })
 * @Get('/items') list() {}
 *
 * @remarks
 * - В этой реализации TTL трактуется как **миллисекунды**. Убедись, что твой CacheStore
 *   ожидает те же единицы (если нужно — конвертируй при записи).
 */
export async function resolveTTL(
  context: ExecutionContext,
  reflector: Reflector,
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

  if (typeof result === 'number') {
    return result;
  }
  return undefined;
}
