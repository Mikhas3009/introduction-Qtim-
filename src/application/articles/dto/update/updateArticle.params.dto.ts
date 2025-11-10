import { IsUUID } from 'class-validator';

export class UpdateArticleParamsDto {
  @IsUUID('4')
  id: string;
}
