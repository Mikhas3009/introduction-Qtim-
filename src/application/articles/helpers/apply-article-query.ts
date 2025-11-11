import { SelectQueryBuilder } from 'typeorm';
import { ArticleEntity } from '../entities/article.entity';
import { ArticleSortByEnum } from 'src/core/enums/articleSortBy.enum';
import { SortOrderEnum } from 'src/core/enums/sortBy.enum';
import { ListArticleQueryDto } from '../dto/list/listArticle.query.dto';

/**
 * Применяет к запросу набор фильтров для выборки статей.
 *
 * Поддерживаемые поля `ListArticleQueryDto` (ожидаемые):
 * - `ids?: string[]` — список UUID статей.
 * - `authorIds?: string[]` — список UUID авторов.
 * - `q?: string` — строка полнотекстового поиска по `name`/`description` (простая форма через ILIKE).
 * - `name?: string` — точное совпадение названия.
 * - `hasDescription?: boolean` — наличие (`true`) или отсутствие (`false`) описания.
 * - `includeDeleted?: boolean` — включать soft-deleted записи (`deleted_at IS NOT NULL`). По умолчанию **false** — исключаем удалённые.
 * - `createdFrom?: Date | string` — нижняя граница даты создания (включительно).
 * - `createdTo?: Date | string` — верхняя граница даты создания (**исключительно**).
 *
 * @param qb    QueryBuilder, на который навешиваются условия.
 * @param data  Объект с фильтрами (см. поля выше).
 * @param alias Алиас таблицы/основной сущности (должен совпадать с тем, что использовался в createQueryBuilder). По умолчанию `'a'`.
 * @returns Тот же `QueryBuilder` (для чейнинга).
 *
 *
 */
export function applyArticleFilters(
  qb: SelectQueryBuilder<ArticleEntity>,
  data: ListArticleQueryDto,
  alias = 'a',
) {
  // id - статей
  if (data.ids?.length) {
    qb.andWhere(`${alias}.article_id IN (:...ids)`, { ids: data.ids });
  }

  // авторы
  if (data.authorIds?.length) {
    qb.andWhere(`${alias}.author_id IN (:...authorIds)`, {
      authorIds: data.authorIds,
    });
  }

  // полнотекстовый поиск по name/description (простой ILIKE)
  if (data.q) {
    qb.andWhere(
      `(${alias}.article_name ILIKE :q OR ${alias}.article_description ILIKE :q)`,
      { q: `%${data.q}%` },
    );
  }

  // точное совпадение имени
  if (data.name) {
    qb.andWhere(`${alias}.article_name = :name`, { name: data.name });
  }

  // наличие/отсутствие description
  if (data.hasDescription !== undefined) {
    if (data.hasDescription) {
      qb.andWhere(
        `${alias}.article_description IS NOT NULL AND ${alias}.article_description <> ''`,
      );
    } else {
      qb.andWhere(
        `(${alias}.article_description IS NULL OR ${alias}.article_description = '')`,
      );
    }
  }

  // soft-delete
  if (!data.includeDeleted) {
    qb.andWhere(`${alias}.deleted_at IS NULL`);
  }

  // диапазон дат
  if (data.createdFrom) {
    qb.andWhere(`${alias}.created_at >= :createdFrom`, {
      createdFrom: data.createdFrom,
    });
  }
  if (data.createdTo) {
    qb.andWhere(`${alias}.created_at < :createdTo`, {
      createdTo: data.createdTo,
    });
  }

  return qb;
}

/**
 * Применяет сортировку к запросу.
 *
 *
 * @param qb    QueryBuilder.
 * @param data  Объект запроса со свойствами:
 *              - `sortBy?: ArticleSortBy` — поле сортировки (по умолчанию `createdAt`).
 *              - `order?: SortOrder` — направление (`ASC`/`DESC`, по умолчанию `DESC`).
 * @param alias Алиас сущности (тот, что использовался в createQueryBuilder). По умолчанию `'a'`.
 * @returns Тот же `QueryBuilder` с применённым `orderBy`.
 *
 */
export function applyArticleSort(
  qb: SelectQueryBuilder<ArticleEntity>,
  data: ListArticleQueryDto,
  alias = 'a',
) {
  const sortMap: Record<ArticleSortByEnum, string> = {
    createdAt: `${alias}.created_at`,
    name: `${alias}.article_name`,
  };
  const column = sortMap[data.sortBy ?? ArticleSortByEnum.createdAt];
  const order = data.order ?? SortOrderEnum.DESC;
  return qb.orderBy(column, order);
}

/**
 * Применяет пагинацию к запросу.
 *
 * Правила:
 * - Если `limit` не указан или falsy — пагинация **не применяется**, возвращается исходный QB.
 *
 * @typeParam T — тип сущности в QueryBuilder.
 * @param qb   QueryBuilder.
 * @param data Объект запроса со свойствами:
 *             - `limit?: number`
 *             - `page?: number` (1-базный)
 * @returns Тот же `QueryBuilder` с применёнными `take/skip` при наличии `limit`.
 */
export function applyPagination<T>(
  qb: SelectQueryBuilder<T>,
  data: ListArticleQueryDto,
) {
  const { limit, page } = data;

  if (!limit) {
    return qb;
  }

  const take = Math.max(1, limit);
  qb.take(take);

  if (page) {
    const skip = Math.max(0, (page - 1) * take);
    qb.skip(skip);
  }

  return qb;
}
