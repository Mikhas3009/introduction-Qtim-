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
