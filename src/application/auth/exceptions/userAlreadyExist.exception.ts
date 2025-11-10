import { HttpException, HttpStatus } from '@nestjs/common';

export class UserAllreadyExistException extends HttpException {
  constructor() {
    super('Пользователь с таким логином уже существует', HttpStatus.CONFLICT);
  }
}
