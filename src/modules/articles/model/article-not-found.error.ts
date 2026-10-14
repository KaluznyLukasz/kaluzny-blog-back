import { NotFoundException } from '@nestjs/common';

export class ArticleNotFoundError extends NotFoundException {
  constructor(readonly articleId: string) {
    super(`Article with id ${articleId} does not exist.`);
  }
}
