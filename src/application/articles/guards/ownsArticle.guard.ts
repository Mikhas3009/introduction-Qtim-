import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleEntity } from '../entities/article.entity';
import { ArticleNotFoundException } from '../exceptions/articleNotFound.exception';
import { NotOwnerOfArticleException } from '../exceptions/notOwnerOfArticle.exception';

/**
 * Guard, который разрешает доступ к мутационным операциям над статьёй
 * только её владельцу (автору).
 *
 * Логика:
 * 1) Берёт `userId` из `req.user.id` (После `JwtGuard`).
 * 2) Берёт идентификатор статьи `id` из `req.params.id`.
 * 3) Загружает статью из БД:
 *    - если статья не найдена — бросает {@link ArticleNotFoundException}.
 * 4) Сравнивает `article.authorId` и `userId`:
 *    - при несовпадении — бросает {@link NotOwnerOfArticleException}.
 * 5) Возвращает `true`, если доступ разрешён.
 */
@Injectable()
export class OwnsArticleGuard implements CanActivate {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepo: Repository<ArticleEntity>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const userId: string | undefined = req.user?.id;
    const id: string | undefined = req.params?.id;

    if (!userId) {
      throw new UnauthorizedException();
    }

    const article = await this.articleRepo.findOne({
      where: {
        id: id,
      },
    });
    if (!article) {
      throw new ArticleNotFoundException();
    }

    if (article.authorId !== userId) {
      throw new NotOwnerOfArticleException();
    }

    return true;
  }
}
