import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CACHE_INVALIDATE_KEY } from '../decorators/invalidateCache.decorator';

export async function resolveInvalidationConfig(
  reflector: Reflector,
  context: ExecutionContext,
): Promise<{ keys: string[]; patterns: string[] }> {
  const handlerInput = reflector.get(CACHE_INVALIDATE_KEY, context.getHandler());
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
