import { HttpException, HttpStatus } from '@nestjs/common';

export class NotOwnerOfArticleException extends HttpException {
  constructor() {
    super('Вы не являеетесь владельцем поста', HttpStatus.FORBIDDEN);
  }
}
