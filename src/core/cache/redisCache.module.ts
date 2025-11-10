import { DynamicModule, Module } from '@nestjs/common';
import {
  RedisCacheService,
  REDIS_CACHE_STORE,
} from './services/redisCache.service';
import { RedisCacheStore } from './stores/redisCache.store';
import { RedisCacheModuleOptions } from './interfaces/redisCacheModuleOptions.interface';

@Module({})
export class RedisCacheModule {
  static forRoot(options: RedisCacheModuleOptions): DynamicModule {
    const store = new RedisCacheStore(
      options.redis,
      options.defaultTtl ?? 60_000,
    );

    return {
      module: RedisCacheModule,
      global: true,
      providers: [
        { provide: REDIS_CACHE_STORE, useValue: store },
        RedisCacheService,
      ],
      exports: [RedisCacheService],
    };
  }
}
