import { ApiProperty, PickType } from '@nestjs/swagger';
import { Article } from '../../../model/article.model';

export class ArticleResponse extends PickType(Article, [
  'id',
  'title',
  'content',
  'publishedAt',
  'imageId',
] as const) {
  @ApiProperty({
    description:
      'Address of the cover image file, null when the article has none. Use it as the src of an img tag.',
    type: String,
    nullable: true,
    example:
      'http://localhost/api/v1/images/1ae9e000-0001-4000-8000-000000000001',
  })
  readonly imageUrl: string | null;
}
