import { Command } from '@nestjs/cqrs';
import { Article } from '../../model/article.model';

export class UpdateArticleCommand extends Command<Article> {
  constructor(
    readonly id: string,
    readonly title?: string,
    readonly content?: string,
  ) {
    super();
  }
}
