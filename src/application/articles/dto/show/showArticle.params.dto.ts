import { IsUUID } from 'class-validator';

export class ShowArticleParamsDto {
  @IsUUID('4')
  id: string;
}
