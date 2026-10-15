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

  constructor(id: string, title: string, content: string, publishedAt: Date) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.publishedAt = publishedAt;
  }

  static publish(id: string, title: string, content: string): Article {
    return new Article(id, title, content, new Date());
  }
}
