import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterUserBodyDto } from '../dto/registerUser.body.dto';
import { UserAllreadyExistException } from '../exceptions/userAlreadyExist.exception';
import { JwtService } from '@nestjs/jwt';
import {
  IJwtPayload,
  ITokensInterface,
} from 'src/core/interfaces/jwtPayload.interface';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { LoginUserBodyDto } from '../dto/loginUser.body.dto';
import { UserNotFoundException } from '../exceptions/userNotFound.exception';
import { WrongPasswordException } from '../exceptions/wrongPassword.exception';

/**
 * Сервис аутентификации: регистрация, логин, генерация токенов.
 *
 * Зависимости:
 * - Репозиторий {@link UserEntity} (TypeORM)
 * - {@link JwtService} — подпись/верификация JWT
 * - {@link ConfigService} — конфигурация (`JWT_REFRESH_EXPIRES_IN`, `BCRYPT_ROUNDS`, и т.д.)
 *
 * Контракт:
 * - {@link register} — создаёт пользователя (если логин свободен), возвращает пару токенов.
 * - {@link login} — авторизует по логину/паролю, возвращает пару токенов.
 * - (priv) {@link foundByLogin} — поиск пользователя по логину.
 * - (priv) {@link generateTokens} — генерация access/refresh токенов.
 * - (priv) {@link hashPassword} — хэширование пароля с `bcrypt`.
 * - (priv) {@link verifyPassword} — проверка введённого пароля.
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Регистрирует нового пользователя: проверка уникальности логина, хэш пароля,
   * сохранение и выдача пары токенов.
   *
   * @param body Данные регистрации (`name`, `login`, `password`, …)
   * @returns {Promise<ITokensInterface>} Объект `{ accessToken, refreshToken }`
   *
   * @throws {UserAllreadyExistException} Если пользователь с таким логином уже существует
   * @throws {Error} Проброс ошибок сохранения БД/хэширования (если возникнут)
   *
   * @example
   * const tokens = await authService.register({ name, login, password });
   */
  async register(body: RegisterUserBodyDto): Promise<ITokensInterface> {
    const { password, ...data } = body;
    const existingUser = await this.foundByLogin(data.login);

    if (existingUser) {
      throw new UserAllreadyExistException();
    }
    const hashPassword = await this.hashPassword(password);

    const createble = this.userRepository.create({
      ...body,
      password: hashPassword,
    });
    const user = await this.userRepository.save(createble);

    return this.generateTokens(user);
  }

  /**
   * Авторизует пользователя: ищет по логину, сравнивает пароль, выдаёт токены.
   *
   * @param body Объект с логином/паролем
   * @returns {Promise<ITokensInterface>} Объект `{ accessToken, refreshToken }`
   *
   * @throws {UserNotFoundException} Если пользователь не найден
   * @throws {WrongPasswordException} Если пароль неверный
   *
   * @example
   * const tokens = await authService.login({ login, password });
   */
  async login(body: LoginUserBodyDto): Promise<ITokensInterface> {
    const user = await this.foundByLogin(body.login);

    if (!user) {
      throw new UserNotFoundException();
    }

    const verifyPassword = await this.verifyPassword(
      body.password,
      user.password,
    );

    if (!verifyPassword) {
      throw new WrongPasswordException();
    }

    return this.generateTokens(user);
  }

  /**
   * Поиск пользователя по логину.
   * @param login Логин пользователя
   * @returns {Promise<UserEntity | null>} Пользователь или `null`, если не найден
   * @private
   */
  private async foundByLogin(login: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({
      where: {
        login: login,
      },
    });
  }

  /**
   * Генерирует пару JWT-токенов.
   *
   * Access-токен подписывается без явного `expiresIn` (будет использован дефолт).
   * Refresh-токен получает `expiresIn` из `JWT_REFRESH_EXPIRES_IN`.
   *
   * @param payload Объект с полями `{ id, name, login }`
   * @returns {{ accessToken: string; refreshToken: string }}
   * @private
   *
   */
  private async generateTokens(
    payload: IJwtPayload,
  ): Promise<ITokensInterface> {
    const { id, name, login } = payload;
    const accessToken = this.jwtService.sign({ id, name, login });
    const refreshToken = this.jwtService.sign(
      { id, name, login },
      {
        expiresIn: this.configService.getOrThrow('JWT_REFRESH_EXPIRES_IN'),
      },
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Хэширует пароль с использованием `bcrypt`.
   *
   * @param password Открытый пароль
   * @returns {Promise<string>} Хэш пароля
   * @private
   *
   * @remarks
   * Количество раундов берётся из `BCRYPT_ROUNDS` (по умолчанию 10).
   */
  private async hashPassword(password: string): Promise<string> {
    const rounds = Number(this.configService.get('BCRYPT_ROUNDS') ?? 10);
    const salt = await bcrypt.genSalt(rounds);

    return bcrypt.hash(password, salt);
  }

  /**
   * Сравнивает пароль с его хэшем.
   * @param password     Открытый пароль
   * @param passwordHash Хэш пароля из базы
   * @returns {Promise<boolean>} `true`, если совпадают
   * @private
   */
  private async verifyPassword(
    password: string,
    passwordHash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }
}
