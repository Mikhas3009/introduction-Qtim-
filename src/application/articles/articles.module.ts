import { Module } from '@nestjs/common';
import { ArticlesController } from './controllers/articles.controller';
import { ArticlesService } from './services/articles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleEntity } from './entities/article.entity';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { RedisCacheModule } from 'src/core/cache/redisCache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ArticleEntity]),
    AuthModule,
    ConfigModule.forRoot(),
    RedisCacheModule.forRoot({
      redis: {
        host: process.env.REDIS_CACHE_HOST,
        port: +process.env.REDIS_CACHE_PORT,
        username: process.env.REDIS_CACHE_USER,
        password: process.env.REDIS_CACHE_PASSWORD,
      },
      defaultTtl: 60_000,
    }),
  ],
  controllers: [ArticlesController],
  providers: [ArticlesService],
})
export class ArticlesModule { }
