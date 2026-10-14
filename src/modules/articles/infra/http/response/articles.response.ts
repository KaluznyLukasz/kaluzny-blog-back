import { ApiProperty } from '@nestjs/swagger';
import { Article } from '../../../model/article.model';

export class ArticleResponse {
  @ApiProperty({
    description: 'Article ID',
    format: 'uuid',
    example: '5e1f0a2b-0001-4000-8000-000000000001',
  })
  id: string;

  @ApiProperty({
    description: 'Article title',
    example: 'Hello, world: why I started this blog',
  })
  title: string;

  @ApiProperty({
    description: 'Article text',
    example:
      'I want a place to write down what I learn while building software.',
  })
  content: string;

  @ApiProperty({
    description: 'When the article was published',
    type: String,
    format: 'date-time',
    example: '2025-01-10T09:00:00.000Z',
  })
  publishedAt: Date;
}

export function toArticleResponse(article: Article): ArticleResponse {
  return {
    id: article.id,
    title: article.title,
    content: article.content,
    publishedAt: article.publishedAt,
  };
}
