import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ArticleNotFoundError } from '../../model/article-not-found.error';
import { ArticlesRepository } from '../../infra/database/repository/articles.repository';
import { UpdateArticleCommand } from './update-article.command';

@CommandHandler(UpdateArticleCommand)
export class UpdateArticleHandler implements ICommandHandler<UpdateArticleCommand> {
  constructor(private readonly articlesRepository: ArticlesRepository) {}

  async execute(command: UpdateArticleCommand): Promise<void> {
    const updated = await this.articlesRepository.update(command.id, {
      title: command.title,
      content: command.content,
    });

    if (!updated) {
      throw new ArticleNotFoundError(command.id);
    }
  }
}
