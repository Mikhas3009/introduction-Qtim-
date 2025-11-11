import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Guard, проверяющий наличие и валидность access-JWT в cookie `accessToken`.
 *
 * Логика:
 * 1) Достаёт значение из `req.cookies.accessToken`.
 * 2) Верифицирует токен через {@link JwtService.verify} с секретом `JWT_SECRET`.
 * 3) Кладёт декодированный payload в `req.user` для дальнейших обработчиков.
 * 4) Возвращает `true` при успехе, иначе бросает `UnauthorizedException`.
 */
@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();
    try {
      const authCookie = req.cookies?.accessToken;
      req.user = this.jwtService.verify(authCookie, {
        secret: this.configService.get('JWT_SECRET'),
      });

      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
