import { Module } from '@nestjs/common';
import { AuthModule } from './application/auth/auth.module';
import { ArticlesModule } from './application/articles/articles.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [AuthModule, ArticlesModule, DatabaseModule],
})
export class AppModule {}
