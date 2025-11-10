import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterUserBodyDto } from '../dto/registerUser.body.dto';
import { UserAllreadyExistException } from '../exceptions/userAlreadyExist.exception';
import { JwtService } from '@nestjs/jwt';
import { IJwtPayload } from 'src/core/interfaces/jwtPayload.interface';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { LoginUserBodyDto } from '../dto/loginUser.body.dto';
import { UserNotFoundException } from '../exceptions/userNotFound.exception';
import { WrongPasswordException } from '../exceptions/wrongPassword.exception';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepositoy: Repository<UserEntity>,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(body: RegisterUserBodyDto) {
    const { password, ...data } = body;
    const existingUser = await this.foundByLogin(data.login);

    if (existingUser) {
      throw new UserAllreadyExistException();
    }
    const hashPassrod = await this.hashPassword(password);

    const createble = this.userRepositoy.create({
      ...body,
      password: hashPassrod,
    });
    const user = await this.userRepositoy.save(createble);

    return this.generateTokens(user);
  }

  async login(body: LoginUserBodyDto) {
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

  private async foundByLogin(login: string) {
    return await this.userRepositoy.findOne({
      where: {
        login: login,
      },
    });
  }

  private async generateTokens(payload: IJwtPayload) {
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

  private async hashPassword(password: string): Promise<string> {
    const rounds = Number(this.configService.get('BCRYPT_ROUNDS') ?? 10);
    const salt = await bcrypt.genSalt(rounds);

    return bcrypt.hash(password, salt);
  }

  private async verifyPassword(password: string, passwordHash: string) {
    return bcrypt.compare(password, passwordHash);
  }
}
