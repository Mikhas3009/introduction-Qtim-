import { RedisOptions } from "ioredis";

export interface RedisCacheModuleOptions {
    redis: RedisOptions;
    defaultTtl?: number;
}
