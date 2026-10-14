export class Article {
  constructor(
    readonly id: string,
    readonly title: string,
    readonly content: string,
    readonly publishedAt: Date,
  ) {}
}
