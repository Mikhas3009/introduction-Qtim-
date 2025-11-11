import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserEntity } from 'src/application/auth/entities/user.entity';
import { ArticleEntity } from 'src/application/articles/entities/article.entity';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get<string>('POSTGRES_HOST', 'localhost'),
        port: parseInt(cfg.get<string>('POSTGRES_PORT', '5432'), 10),
        username: cfg.get<string>('POSTGRES_USER', 'postgres'),
        password: cfg.get<string>('POSTGRES_PASSWORD') || undefined,
        database: cfg.get<string>('POSTGRES_DB', 'introduction'),
        autoLoadEntities: true,
        entities: [UserEntity, ArticleEntity],
        synchronize: false,
        migrationsRun: true,
        migrations: [join(__dirname, 'migrations/*.{ts,js}')],
        logging: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
