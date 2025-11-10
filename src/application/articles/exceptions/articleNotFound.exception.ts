import { HttpException, HttpStatus } from '@nestjs/common';

export class ArticleNotFoundException extends HttpException {
  constructor() {
    super('Статья не найдена', HttpStatus.NOT_FOUND);
  }
}
