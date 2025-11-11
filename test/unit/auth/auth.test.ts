import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserEntity } from 'src/application/auth/entities/user.entity';
import { UserAllreadyExistException } from 'src/application/auth/exceptions/userAlreadyExist.exception';
import { UserNotFoundException } from 'src/application/auth/exceptions/userNotFound.exception';
import { WrongPasswordException } from 'src/application/auth/exceptions/wrongPassword.exception';
import { AuthService } from 'src/application/auth/services/auth.service';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
}));

type MockRepo<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('AuthService (UUID id)', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Repository<UserEntity>>;
  let jwt: jest.Mocked<JwtService>;
  let config: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const userRepositoryMock: MockRepo<UserEntity> = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: userRepositoryMock,
        },
        { provide: JwtService, useValue: { sign: jest.fn() } },
        {
          provide: ConfigService,
          useValue: { get: jest.fn(), getOrThrow: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(UserEntity));
    jwt = module.get(JwtService);
    config = module.get(ConfigService);

    (bcrypt.genSalt as jest.Mock).mockReset();
    (bcrypt.hash as jest.Mock).mockReset();
    (bcrypt.compare as jest.Mock).mockReset();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('успешная регистрация (UUID id), пароль хэшируется, токены генерируются', async () => {
      const body = { name: 'John', login: 'john', password: 'plain' };

      (userRepo.findOne as jest.Mock).mockResolvedValue(null);
      (config.get as jest.Mock).mockReturnValue('12');
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt12');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hash$12');

      const created = { ...body, password: 'hash$12' } as UserEntity;
      const saved: UserEntity = {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'John',
        login: 'john',
        password: 'hash$12',
      } as any;

      (userRepo.create as jest.Mock).mockReturnValue(created);
      (userRepo.save as jest.Mock).mockResolvedValue(saved);

      (config.getOrThrow as jest.Mock).mockReturnValue('7d');
      (jwt.sign as jest.Mock)
        .mockImplementationOnce(() => 'access.token')
        .mockImplementationOnce(() => 'refresh.token');

      const res = await service.register(body as any);

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { login: 'john' },
      });
      expect(bcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(bcrypt.hash).toHaveBeenCalledWith('plain', 'salt12');
      expect(userRepo.create).toHaveBeenCalledWith({
        ...body,
        password: 'hash$12',
      });
      expect(userRepo.save).toHaveBeenCalledWith(created);

      expect(jwt.sign).toHaveBeenNthCalledWith(1, {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'John',
        login: 'john',
      });
      expect(config.getOrThrow).toHaveBeenCalledWith('JWT_REFRESH_EXPIRES_IN');
      expect(jwt.sign).toHaveBeenNthCalledWith(
        2,
        {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'John',
          login: 'john',
        },
        { expiresIn: '7d' },
      );

      expect(res).toEqual({
        accessToken: 'access.token',
        refreshToken: 'refresh.token',
      });
    });

    it('бросает UserAllreadyExistException, если логин занят', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue({ id: 'uuid-1' });

      await expect(
        service.register({ name: 'A', login: 'john', password: 'x' } as any),
      ).rejects.toBeInstanceOf(UserAllreadyExistException);

      expect(bcrypt.genSalt).not.toHaveBeenCalled();
      expect(userRepo.save).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('использует дефолтные 10 раундов, если BCRYPT_ROUNDS не задан', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);
      (config.get as jest.Mock).mockReturnValue(undefined);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt10');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hash$10');

      (userRepo.create as jest.Mock).mockImplementation((x) => x);
      (userRepo.save as jest.Mock).mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000002',
        name: 'John',
        login: 'john',
        password: 'hash$10',
      } as any);

      (config.getOrThrow as jest.Mock).mockReturnValue('7d');
      (jwt.sign as jest.Mock)
        .mockImplementationOnce(() => 'access.token')
        .mockImplementationOnce(() => 'refresh.token');

      await service.register({
        name: 'John',
        login: 'john',
        password: 'p',
      } as any);
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    });
  });

  describe('login', () => {
    it('успешный логин с UUID id', async () => {
      const user: UserEntity = {
        id: '00000000-0000-0000-0000-0000000000aa',
        name: 'Jane',
        login: 'jane',
        password: 'hash$',
      } as any;

      (userRepo.findOne as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (config.getOrThrow as jest.Mock).mockReturnValue('30d');
      (jwt.sign as jest.Mock)
        .mockImplementationOnce(() => 'access.2')
        .mockImplementationOnce(() => 'refresh.2');

      const res = await service.login({ login: 'jane', password: 'ok' } as any);

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { login: 'jane' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('ok', 'hash$');

      expect(jwt.sign).toHaveBeenNthCalledWith(1, {
        id: '00000000-0000-0000-0000-0000000000aa',
        name: 'Jane',
        login: 'jane',
      });
      expect(jwt.sign).toHaveBeenNthCalledWith(
        2,
        {
          id: '00000000-0000-0000-0000-0000000000aa',
          name: 'Jane',
          login: 'jane',
        },
        { expiresIn: '30d' },
      );

      expect(res).toEqual({
        accessToken: 'access.2',
        refreshToken: 'refresh.2',
      });
    });

    it('пользователь не найден - бросаем UserNotFoundException', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({ login: 'nouser', password: 'x' } as any),
      ).rejects.toBeInstanceOf(UserNotFoundException);

      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('неверный пароль бросаем WrongPasswordException', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue({
        id: '00000000-0000-0000-0000-0000000000bb',
        name: 'Bob',
        login: 'bob',
        password: 'hash$',
      } as any);

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ login: 'bob', password: 'bad' } as any),
      ).rejects.toBeInstanceOf(WrongPasswordException);

      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });
});
