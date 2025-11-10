import { RedisCacheService } from '../services/redisCache.service';

/** Точечная инвалидация + инвалидация по паттернам */
export async function invalidateCache(
  cacheService: RedisCacheService,
  config: { keys: string[]; patterns: string[] },
): Promise<void> {
  const { keys, patterns } = config;

  for (const key of keys) {
    try {
      await cacheService.del(key);
    } catch (e: any) {
      console.log(`Failed to delete cache key "${key}": ${e?.message ?? e}`);
    }
  }

  for (const pattern of patterns) {
    try {
      await cacheService.delByPattern(pattern);
    } catch (e: any) {
      console.log(
        `Failed to delete cache pattern "${pattern}": ${e?.message ?? e}`,
      );
    }
  }
}
