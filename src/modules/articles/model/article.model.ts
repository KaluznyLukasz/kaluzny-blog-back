import { randomUUID } from 'crypto';

export class Article {
  constructor(
    readonly id: string,
    readonly title: string,
    readonly content: string,
    readonly publishedAt: Date,
  ) {}

  static publish(title: string, content: string): Article {
    return new Article(randomUUID(), title, content, new Date());
  }
}
