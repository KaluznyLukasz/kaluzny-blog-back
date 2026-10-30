import { ApiProperty } from '@nestjs/swagger';

export class Article {
  @ApiProperty({
    description: 'Article ID',
    format: 'uuid',
    example: '5e1f0a2b-0001-4000-8000-000000000001',
  })
  readonly id: string;

  @ApiProperty({
    description: 'Article title',
    example: 'Hello, world: why I started this blog',
  })
  readonly title: string;

  @ApiProperty({
    description: 'Article text',
    example:
      'I want a place to write down what I learn while building software.',
  })
  readonly content: string;

  @ApiProperty({
    description: 'When the article was published',
    type: String,
    format: 'date-time',
    example: '2025-01-10T09:00:00.000Z',
  })
  readonly publishedAt: Date;

  @ApiProperty({
    description:
      'ID of the cover image of the article (an image uploaded with POST /api/v1/images), null when the article has none',
    type: String,
    format: 'uuid',
    nullable: true,
    example: '1ae9e000-0001-4000-8000-000000000001',
  })
  readonly imageId: string | null;

  constructor(
    id: string,
    title: string,
    content: string,
    publishedAt: Date,
    imageId: string | null,
  ) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.publishedAt = publishedAt;
    this.imageId = imageId;
  }

  static publish(
    id: string,
    title: string,
    content: string,
    imageId: string | null,
  ): Article {
    return new Article(id, title, content, new Date(), imageId);
  }
}
