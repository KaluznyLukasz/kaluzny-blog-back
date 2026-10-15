import { Command } from '@nestjs/cqrs';
import { Article } from '../../model/article.model';

export class CreateArticleCommand extends Command<Article> {
  constructor(
    readonly title: string,
    readonly content: string,
  ) {
    super();
  }
}
