import { HttpException, HttpStatus } from '@nestjs/common';

export class NotOwnerOfArticleException extends HttpException {
  constructor() {
    super('Вы не являетесь владельцем статьи', HttpStatus.FORBIDDEN);
  }
}
