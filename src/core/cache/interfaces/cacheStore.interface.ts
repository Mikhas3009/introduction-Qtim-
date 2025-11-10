/**
 * Абстракция бэкенда кэша.
 */
export interface CacheStore {
  get<T = any>(key: string): Promise<T | undefined>;
  set<T = any>(key: string, value: T, ttl?: number): Promise<boolean> | boolean;
  del(key: string): Promise<boolean>;
  delByPattern(pattern: string): Promise<number>;
}
