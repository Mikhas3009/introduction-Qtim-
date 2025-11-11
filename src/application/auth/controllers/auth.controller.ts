import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginUserBodyDto } from '../dto/loginUser.body.dto';
import { RegisterUserBodyDto } from '../dto/registerUser.body.dto';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { setTokenCookie } from '../helpers/setCookies.helper';

/**
 * Контроллер аутентификации.
 *
 * Экспонирует два эндпоинта:
 * - `POST /auth/login` — вход по логину/паролю;
 * - `POST /auth/register` — регистрация нового пользователя.
 *
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Вход пользователя по логину и паролю.
   *
   * @summary Авторизация по логину/паролю
   * @route POST /auth/login
   * @param body Тело запроса с учётными данными пользователя
   * @param response Экземпляр Express `Response` для установки Set-Cookie
   * @returns {Promise<void>} Ничего не возвращает в теле по умолчанию; см. примечания.
   *
   * @throws {UserNotFoundException} Если пользователь с таким логином не найден
   * @throws {WrongPasswordException} Если пароль неверный
   *
   */
  @Post('login')
  async login(
    @Body() body: LoginUserBodyDto,
    @Res() response: Response,
  ): Promise<void> {
    const tokens = await this.authService.login(body);
    setTokenCookie(response, tokens, this.configService);

    response.status(HttpStatus.OK).send({ success: true });
  }

  /**
   * Регистрация нового пользователя.
   *
   * @summary Регистрация пользователя
   * @route POST /auth/register
   * @param body Тело запроса с данными нового пользователя
   * @param response Экземпляр Express `Response` для установки Set-Cookie
   * @returns {Promise<void>} Ничего не возвращает в теле по умолчанию; см. примечания.
   *
   * @throws {UserAllreadyExistException} Если логин уже занят
   */
  @Post('register')
  async register(
    @Body() body: RegisterUserBodyDto,
    @Res() response: Response,
  ): Promise<void> {
    const tokens = await this.authService.register(body);
    setTokenCookie(response, tokens, this.configService);

    response.status(HttpStatus.CREATED).send({ success: true });
  }
}
