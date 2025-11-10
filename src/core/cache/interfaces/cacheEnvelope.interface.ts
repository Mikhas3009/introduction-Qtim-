/**
 * Обёртка значения в кэше с меткой времени,
 * чтобы корректно сравнивать «свежесть».
 */
export interface CacheEnvelope<T = any> {
  data: T;
  cachedAt: number;
}
