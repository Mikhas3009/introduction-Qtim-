import Redis, { RedisOptions } from 'ioredis';
import { CacheStore } from '../interfaces/cacheStore.interface';
import { wrapValue } from '../helpers/wrapValue';
import { matchPattern } from '../helpers/matchPattern';

/** Реализация CacheStore на Redis (ioredis) */
export class RedisCacheStore implements CacheStore {
  private readonly client: Redis;
  private readonly defaultTtl: number;

  constructor(options: Redis | RedisOptions, defaultTtl: number = 60_000) {
    this.client = options instanceof Redis ? options : new Redis(options);
    this.defaultTtl = defaultTtl;
  }

  // Возвращаем обобщённый T, чтобы соответствовать интерфейсу CacheStore
  async get<T = any>(key: string): Promise<T | undefined> {
    const raw = await this.client.get(key);
    if (raw == null) return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }

  // Сигнатура set совпадает с интерфейсом; значения всегда оборачиваем перед записью
  async set<T = any>(key: string, value: T, ttl?: number): Promise<boolean> {
    const envelope = wrapValue(value as any);
    const expireSeconds = Math.max(
      1,
      Math.floor((ttl ?? this.defaultTtl) / 1000),
    );
    await this.client.set(key, JSON.stringify(envelope), 'EX', expireSeconds);
    return true;
  }

  async del(key: string): Promise<boolean> {
    return (await this.client.del(key)) > 0;
  }

  /** Удаление по шаблону (SCAN + MATCH + DEL) */
  async delByPattern(pattern: string): Promise<number> {
    let cursor = '0';
    let totalDeleted = 0;
    do {
      const [nextCursor, keys] = await this.client.scan(
        cursor,
        'MATCH',
        pattern || '*',
        'COUNT',
        1000,
      );
      cursor = nextCursor;
      const matchedKeys = keys.filter((k) => matchPattern(k, pattern));
      if (matchedKeys.length > 0) {
        const deleted = await this.client.del(...matchedKeys);
        totalDeleted += deleted;
      }
    } while (cursor !== '0');
    return totalDeleted;
  }
}
