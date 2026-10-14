export class ArticleNotFoundError extends Error {
  constructor(readonly articleId: string) {
    super(`Article with id ${articleId} does not exist.`);
  }
}
