import { Inject, Injectable } from '@nestjs/common';
import { CacheEnvelope } from '../interfaces/cacheEnvelope.interface';
import { CacheStore } from '../interfaces/cacheStore.interface';
import { wrapValue } from '../helpers/wrapValue';

export const REDIS_CACHE_STORE = Symbol('REDIS_CACHE_STORE');

@Injectable()
export class RedisCacheService {
  constructor(@Inject(REDIS_CACHE_STORE) private readonly store: CacheStore) {}

  async get<T = unknown>(key: string): Promise<T | undefined> {
    const envelope = (await this.store.get<CacheEnvelope<T>>(key)) as any;
    return envelope?.data ?? undefined;
  }

  async set<T = unknown>(
    key: string,
    value: T,
    ttl?: number,
  ): Promise<boolean> {
    const envelope = wrapValue(value);
    return this.store.set<CacheEnvelope<T>>(key, envelope as any, ttl);
  }

  async del(key: string): Promise<boolean> {
    return this.store.del(key);
  }

  async delByPattern(pattern: string): Promise<number> {
    return this.store.delByPattern(pattern);
  }
}
