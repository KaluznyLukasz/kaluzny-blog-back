import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Article } from '../../model/article.model';
import { ArticleNotFoundError } from '../../model/article-not-found.error';
import { ArticlesRepository } from '../../infra/database/repository/articles.repository';
import { UpdateArticleCommand } from './update-article.command';

@CommandHandler(UpdateArticleCommand)
export class UpdateArticleHandler implements ICommandHandler<UpdateArticleCommand> {
  constructor(private readonly articlesRepository: ArticlesRepository) {}

  async execute(command: UpdateArticleCommand): Promise<Article> {
    const article = await this.articlesRepository.update(command.id, {
      title: command.title,
      content: command.content,
    });

    if (!article) {
      throw new ArticleNotFoundError(command.id);
    }

    return article;
  }
}
