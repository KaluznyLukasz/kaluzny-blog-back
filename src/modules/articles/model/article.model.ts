export class Article {
  constructor(
    readonly id: string,
    readonly title: string,
    readonly content: string,
    readonly publishedAt: Date,
  ) {}

  static publish(id: string, title: string, content: string): Article {
    return new Article(id, title, content, new Date());
  }
}
