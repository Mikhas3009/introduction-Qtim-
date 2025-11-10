import { IsString, Length } from 'class-validator';
import { MIN_PASSWORD_LENGTH } from '../const/minPasswordLength';

export class LoginUserBodyDto {
  @IsString()
  login: string;

  @IsString()
  @Length(MIN_PASSWORD_LENGTH)
  password: string;
}
