import { HttpException, HttpStatus } from '@nestjs/common';

export class UserNotFoundException extends HttpException {
  constructor() {
    super('Пользователь не найден', HttpStatus.NOT_FOUND);
  }
}
