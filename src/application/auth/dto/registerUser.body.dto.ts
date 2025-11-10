import { IsString, Length } from 'class-validator';
import { MIN_PASSWORD_LENGTH } from '../const/minPasswordLength';

export class RegisterUserBodyDto {
  @IsString()
  login: string;

  @Length(MIN_PASSWORD_LENGTH)
  @IsString()
  password: string;

  @IsString()
  name: string;
}
