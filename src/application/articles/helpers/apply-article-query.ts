import { SelectQueryBuilder } from 'typeorm';
import { ArticleEntity } from '../entities/article.entity';
import { ArticleSortBy } from 'src/core/enums/articleSortBy.enum';
import { SortOrder } from 'src/core/enums/sortBy.enum';
import { ListArticleQueryDto } from '../dto/list/listArticle.query.dto';

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

export function applyArticleSort(
  qb: SelectQueryBuilder<ArticleEntity>,
  data: ListArticleQueryDto,
  alias = 'a',
) {
  const sortMap: Record<ArticleSortBy, string> = {
    createdAt: `${alias}.created_at`,
    name: `${alias}.article_name`,
  };
  const column = sortMap[data.sortBy ?? ArticleSortBy.createdAt];
  const order = data.order ?? SortOrder.DESC;
  return qb.orderBy(column, order);
}

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
