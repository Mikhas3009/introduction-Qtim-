import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArticleEntity } from '../entities/article.entity';
import { Repository } from 'typeorm';
import { ListArticleQueryDto } from '../dto/list/listArticle.query.dto';
import {
  applyArticleFilters,
  applyArticleSort,
  applyPagination,
} from '../helpers/apply-article-query';
import { ShowArticleParamsDto } from '../dto/show/showArticle.params.dto';
import { ArticleNotFoundException } from '../exceptions/articleNotFound.exception';
import { DeleteArticleParamsDto } from '../dto/delete/deleteArticle.params.dto';
import { StoreArticleBodyDto } from '../dto/store/storeArticle.body.dto';
import { UpdateArticleBodyDto } from '../dto/update/updateArticle.body.dto';
import { UpdateArticleParamsDto } from '../dto/update/updateArticle.params.dto';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
  ) {}

  async list(data: ListArticleQueryDto) {
    const qb = this.articleRepository.createQueryBuilder('a');
    applyArticleFilters(qb, data);
    applyArticleSort(qb, data);
    applyPagination(qb, data);

    return await qb.getMany();
  }

  async show(data: ShowArticleParamsDto) {
    const { id } = data;
    const article = await this.articleRepository.findOne({
      where: { id: id },
    });

    if (!article) {
      throw new ArticleNotFoundException();
    }

    return article;
  }

  async store(data: StoreArticleBodyDto) {
    const { author, ...body } = data;
    const creatable = this.articleRepository.create({
      ...body,
      authorId: author.id,
    });
    return await this.articleRepository.save(creatable);
  }

  async delete(data: DeleteArticleParamsDto) {
    const { id } = data;
    const deleted = await this.articleRepository.delete(id);

    if (!deleted.affected) {
      throw new ArticleNotFoundException();
    }

    return { success: true };
  }

  async update(body: UpdateArticleBodyDto, param: UpdateArticleParamsDto) {
    await this.articleRepository.update(param.id, body);

    return { succeess: true };
  }
}
