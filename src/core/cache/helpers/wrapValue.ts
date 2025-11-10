import { CacheEnvelope } from '../interfaces/cacheEnvelope.interface';

/** Оборачивает произвольное значение в CacheEnvelope */
export function wrapValue<T>(value: T | CacheEnvelope<T>): CacheEnvelope<T> {
  if (
    value &&
    typeof (value as CacheEnvelope<T>).cachedAt === 'number' &&
    (value as CacheEnvelope<T>).data !== undefined
  ) {
    return value as CacheEnvelope<T>;
  }
  return { data: value as T, cachedAt: Date.now() };
}
