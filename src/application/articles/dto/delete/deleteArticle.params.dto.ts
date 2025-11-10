import { IsUUID } from 'class-validator';

export class DeleteArticleParamsDto {
  @IsUUID('4')
  id: string;
}
