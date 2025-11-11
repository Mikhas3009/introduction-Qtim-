import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ArticlesService } from '../services/articles.service';
import { ShowArticleParamsDto } from '../dto/show/showArticle.params.dto';
import { StoreArticleBodyDto } from '../dto/store/storeArticle.body.dto';
import { JwtGuard } from 'src/application/auth/guards/jwt.guard';
import { User } from 'src/application/auth/decorators/user.decorator';
import { IAuthUser } from 'src/core/interfaces/IAuthUser.interface';
import { UpdateArticleBodyDto } from '../dto/update/updateArticle.body.dto';
import { UpdateArticleParamsDto } from '../dto/update/updateArticle.params.dto';
import { DeleteArticleParamsDto } from '../dto/delete/deleteArticle.params.dto';
import { ListArticleQueryDto } from '../dto/list/listArticle.query.dto';
import { OwnsArticleGuard } from '../guards/ownsArticle.guard';
import { InvalidateArticleCache } from '../decorators/generateArticleCache.decorator';
import { Cache } from 'src/core/cache/decorators/cache.decorator';
import { ARTICLE_CACHE_TTL } from '../const/ArticleCacheMaxTime';
import { ArticleEntity } from '../entities/article.entity';

/**
 * Контроллер статей.
 *
 * Отвечает за CRUD-операции над сущностью «статья» и интегрирован с кэшем Redis:
 * - На уровне класса навешан декоратор {@link InvalidateArticleCache}, который
 *   после успешных мутаций (POST/PATCH/DELETE) инвалидацирует связанные ключи кэша.
 * - Эндпоинт `GET /articles/:id` кэшируется через {@link Cache} на время `ARTICLE_CACHE_TTL`.
 */
@InvalidateArticleCache()
@Controller('articles')
export class ArticlesController {
  /**
   * @param articlesService Сервис доменной логики для работы со статьями
   */
  constructor(private readonly articlesService: ArticlesService) {}

  /**
   * Получить одну статью по идентификатору.
   *
   * @summary Показать статью
   * @param params Параметры маршрута
   * @param params.id Идентификатор статьи
   * @returns {Promise<ArticleEntity>} Данные статьи
   *
   * @throws {NotFoundException} Если статья не найдена
   * @throws {BadRequestException} Если `id` некорректен
   *
   */
  @Cache(ARTICLE_CACHE_TTL)
  @Get('/:id')
  async show(@Param() params: ShowArticleParamsDto): Promise<ArticleEntity> {
    return await this.articlesService.show(params);
  }

  /**
   * Получить список статей с фильтрацией/пагинацией.
   *
   * @summary Список статей
   * @param query Параметры фильтрации/сортировки/пагинации
   * @returns {Promise<ArticleEntity[]>} Коллекция статей (возможно, с метаданными пагинации)
   *
   * @throws {BadRequestException} Если параметры запроса некорректны
   */
  @Get()
  async list(@Query() query: ListArticleQueryDto): Promise<ArticleEntity[]> {
    return await this.articlesService.list(query);
  }

  /**
   * Создать новую статью.
   *
   * Требуется аутентификация (`JwtGuard`). Автор берётся из контекста и
   * подставляется в тело перед передачей в сервис.
   * После успешного создания срабатывает инвалидация кэша по паттернам из
   * декоратора {@link InvalidateArticleCache}.
   *
   * @summary Создать статью
   * @security JWT
   * @param body Тело запроса для создания статьи
   * @param user Текущий аутентифицированный пользователь (автор)
   * @returns {Promise<unknown>} Созданная статья
   *
   * @throws {UnauthorizedException} Если отсутствует или некорректен токен
   * @throws {BadRequestException} Если тело запроса некорректно
   *
   * @remarks
   * Типичный статус ответа — `201 Created` (если настроен глобально/на роуте).
   * В противном случае Nest вернёт `200 OK` с созданной сущностью.
   */
  @UseGuards(JwtGuard)
  @Post()
  async store(
    @Body() body: StoreArticleBodyDto,
    @User() user: IAuthUser,
  ): Promise<ArticleEntity> {
    body['author'] = user;
    return await this.articlesService.store(body);
  }

  /**
   * Частично обновить статью по идентификатору.
   *
   * Требуется аутентификация и владение ресурсом (`JwtGuard`, `OwnsArticleGuard`).
   * После успешного обновления будет выполнена инвалидация кэша связанных ключей.
   *
   * @summary Обновить статью
   * @security JWT
   * @param body Частичное тело обновления
   * @param param Параметры маршрута
   * @param param.id Идентификатор статьи
   * @returns { Promise<ArticleEntity>} Результат обновления
   *
   * @throws {UnauthorizedException} Без токена
   * @throws {ForbiddenException} Если пользователь не владелец статьи
   * @throws {NotFoundException} Если статья не найдена
   * @throws {BadRequestException} Если данные обновления некорректны
   */
  @UseGuards(JwtGuard, OwnsArticleGuard)
  @Patch('/:id')
  async update(
    @Body() body: UpdateArticleBodyDto,
    @Param() param: UpdateArticleParamsDto,
  ): Promise<ArticleEntity> {
    return await this.articlesService.update(body, param);
  }

  /**
   * Удалить статью по идентификатору.
   *
   * Требуется аутентификация и владение ресурсом (`JwtGuard`, `OwnsArticleGuard`).
   * После успешного удаления кэш соответствующих ключей будет инвалидирован.
   *
   * @summary Удалить статью
   * @security JWT
   * @param param Параметры маршрута
   * @param param.id Идентификатор статьи
   * @returns {Promise<{success:boolean}>} Результат удаления
   *
   * @throws {UnauthorizedException} Без токена
   * @throws {ForbiddenException} Не владелец
   * @throws {NotFoundException} Если статья не найдена
   */
  @UseGuards(JwtGuard, OwnsArticleGuard)
  @Delete('/:id')
  async delete(
    @Param() param: DeleteArticleParamsDto,
  ): Promise<{ success: boolean }> {
    return await this.articlesService.delete(param);
  }
}
