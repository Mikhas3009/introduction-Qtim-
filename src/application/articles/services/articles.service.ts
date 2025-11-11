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

/**
 * Сервис для работы со статьями (CRUD-операции).
 *
 * Инкапсулирует типовые операции репозитория TypeORM и применяет
 * к запросам общие хелперы фильтрации/сортировки/пагинации.
 *
 * Контракт:
 * - `list` — выборка множества статей по фильтрам/сортировке/страницам;
 * - `show` — получение одной статьи по `id`, бросает {@link ArticleNotFoundException}, если не найдена;
 * - `store` — создание новой статьи; в БД записывается `authorId` из `data.author.id`;
 * - `delete` — удаление по `id`; при отсутствии записи бросает {@link ArticleNotFoundException};
 * - `update` — частичное обновление по `id`.
 */
@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
  ) {}

  /**
   * Возвращает список статей с учётом фильтров, сортировки и пагинации.
   *
   * Последовательно применяет:
   * - {@link applyArticleFilters} — фильтры (ids, authorIds, q, name, hasDescription, createdFrom/To, soft-delete);
   * - {@link applyArticleSort} — сортировку (по белому списку полей);
   * - {@link applyPagination} — limit/page.
   *
   * @param {ListArticleQueryDto} data Параметры запроса списка.
   * @returns {Promise<ArticleEntity[]>} Массив статей.
   *
   */
  async list(data: ListArticleQueryDto): Promise<ArticleEntity[]> {
    const qb = this.articleRepository.createQueryBuilder('a');
    applyArticleFilters(qb, data);
    applyArticleSort(qb, data);
    applyPagination(qb, data);

    return await qb.getMany();
  }

  /**
   * Возвращает одну статью по идентификатору.
   *
   * @param {ShowArticleParamsDto} data Параметры маршрута с UUID статьи.
   * @returns {Promise<ArticleEntity>} Найденная статья.
   * @throws {ArticleNotFoundException} Если статья с указанным `id` не найдена.
   *
   * @example
   * await articlesService.show({ id: '5e6f...-uuid' });
   */
  async show(data: ShowArticleParamsDto): Promise<ArticleEntity> {
    const { id } = data;
    const article = await this.articleRepository.findOne({
      where: { id: id, deletedAt: null },
    });

    if (!article) {
      throw new ArticleNotFoundException();
    }

    return article;
  }

  /**
   * Создаёт новую статью.
   *
   * Из тела запроса забирается `author` (пользователь из контекста),
   * в запись прокидывается как `authorId = author.id`.
   *
   * @param {StoreArticleBodyDto} data Данные новой статьи (имя, описание, автор).
   * @returns {Promise<ArticleEntity>} Созданная статья.
   *
   * @example
   * await articlesService.store({ name: 'Заголовок', description: '...', author: { id: 'user-uuid' } });
   */
  async store(data: StoreArticleBodyDto): Promise<ArticleEntity> {
    const { author, ...body } = data;
    const creatable = this.articleRepository.create({
      ...body,
      authorId: author.id,
    });
    return await this.articleRepository.save(creatable);
  }

  /**
   * Удаляет статью по идентификатору (Мягкое удаление).
   *
   * @param {DeleteArticleParamsDto} data Параметры с UUID статьи.
   * @returns {Promise<{success: true}>} Результат удаления.
   * @throws {ArticleNotFoundException} Если запись не найдена (`affected = 0`).
   *
   */
  async delete(data: DeleteArticleParamsDto): Promise<{ success: true }> {
    const { id } = data;
    const deleted = await this.articleRepository.softDelete(id);

    if (!deleted.affected) {
      throw new ArticleNotFoundException();
    }

    return { success: true };
  }

  /**
   * Частично обновляет статью.
   *
   * @param {UpdateArticleBodyDto} body Изменяемые поля (name/description).
   * @param {UpdateArticleParamsDto} param Параметры с UUID статьи.
   * @returns { Promise<ArticleEntity>} Результат обновления (флаг).
   *
   */
  async update(
    body: UpdateArticleBodyDto,
    param: UpdateArticleParamsDto,
  ): Promise<ArticleEntity> {
    const updated = await this.articleRepository.update(param.id, body);

    if (!updated.affected) {
      throw new ArticleNotFoundException();
    }

    return await this.show({ id: param.id });
  }
}
