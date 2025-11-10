import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginUserBodyDto } from '../dto/loginUser.body.dto';
import { RegisterUserBodyDto } from '../dto/registerUser.body.dto';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { setTokenCookie } from '../helpres/setCookies.helper';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  async login(@Body() body: LoginUserBodyDto, @Res() response: Response) {
    const tokens = await this.authService.login(body);
    setTokenCookie(response, tokens, this.configService);
  }

  @Post('register')
  async register(@Body() body: RegisterUserBodyDto, @Res() response: Response) {
    const tokens = await this.authService.register(body);
    setTokenCookie(response, tokens, this.configService);
  }
}
