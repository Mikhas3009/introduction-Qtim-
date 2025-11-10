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

@InvalidateArticleCache()
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) { }

  @Cache(ARTICLE_CACHE_TTL)
  @Get('/:id')
  async show(@Param() params: ShowArticleParamsDto) {
    return await this.articlesService.show(params);
  }

  @Get()
  async list(@Query() query: ListArticleQueryDto) {
    return await this.articlesService.list(query);
  }

  @UseGuards(JwtGuard)
  @Post()
  async store(@Body() body: StoreArticleBodyDto, @User() user: IAuthUser) {
    body['author'] = user;
    return await this.articlesService.store(body);
  }

  @UseGuards(JwtGuard, OwnsArticleGuard)
  @Patch('/:id')
  async update(
    @Body() body: UpdateArticleBodyDto,
    @Param() param: UpdateArticleParamsDto,
  ) {
    return await this.articlesService.update(body, param);
  }

  @UseGuards(JwtGuard, OwnsArticleGuard)
  @Delete('/:id')
  async delete(@Param() param: DeleteArticleParamsDto) {
    return await this.articlesService.delete(param);
  }
}
