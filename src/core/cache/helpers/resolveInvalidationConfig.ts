import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CACHE_INVALIDATE_KEY } from '../decorators/invalidateCache.decorator';

/**
 * Извлекает конфигурацию инвалидации кэша из метаданных хэндлера/класса.
 *
 * Ищет метаданные по ключу {@link CACHE_INVALIDATE_KEY} сначала на уровне хэндлера,
 * затем на уровне класса (приоритет у хэндлера).
 *
 * @param reflector Инъекция `Reflector` для чтения метаданных
 * @param context   Текущий `ExecutionContext` (передаётся фабрике при необходимости)
 * @returns {Promise<{ keys: string[]; patterns: string[] }>} Нормализованная конфигурация
 *
 *
 */
export async function resolveInvalidationConfig(
  reflector: Reflector,
  context: ExecutionContext,
): Promise<{ keys: string[]; patterns: string[] }> {
  const handlerInput = reflector.get(
    CACHE_INVALIDATE_KEY,
    context.getHandler(),
  );
  const classInput = reflector.get(CACHE_INVALIDATE_KEY, context.getClass());
  const input = handlerInput ?? classInput;

  if (!input) {
    return { keys: [], patterns: [] };
  }
  const result = typeof input === 'function' ? await input(context) : input;

  if (Array.isArray(result)) {
    return { keys: result, patterns: [] };
  }

  if (typeof result === 'object' && result !== null) {
    return { keys: result.keys ?? [], patterns: result.patterns ?? [] };
  }
  return { keys: [], patterns: [] };
}
