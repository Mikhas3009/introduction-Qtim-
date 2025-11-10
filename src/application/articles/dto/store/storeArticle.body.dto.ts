import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { MAX_ARTICLE_NAME_LENGTH } from '../../const/maxArticleNameLength';
import { IAuthUser } from 'src/core/interfaces/IAuthUser.interface';

export class StoreArticleBodyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_ARTICLE_NAME_LENGTH)
  name: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  author?: IAuthUser;
}
