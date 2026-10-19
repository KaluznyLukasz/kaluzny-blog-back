import { PickType } from '@nestjs/swagger';
import { Article } from '../../../model/article.model';

export class ArticleResponse extends PickType(Article, [
  'id',
  'title',
  'content',
  'publishedAt',
] as const) {}
