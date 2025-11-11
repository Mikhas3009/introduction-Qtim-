import { RedisOptions } from 'ioredis';

/**
 * Опции модуля Redis-кэша.
 */
export interface RedisCacheModuleOptions {
  /**
   * Параметры подключения к Redis (см. ioredis `RedisOptions`).
   */
  redis: RedisOptions;

  /**
   * Дефолтный TTL (в миллисекундах), если при записи не передан явный TTL.
   * @default 60_000 (1 минута)
   */
  defaultTtl?: number;
}
