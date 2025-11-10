import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { getJwtConfig } from './config/getJwt.config';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { JwtGuard } from './guards/jwt.guard';

@Module({
  imports: [
    JwtModule.registerAsync(getJwtConfig()),
    ConfigModule,
    TypeOrmModule.forFeature([UserEntity]),
  ],
  providers: [AuthService, JwtGuard],
  controllers: [AuthController],
  exports: [JwtGuard, JwtModule],
})
export class AuthModule {}
