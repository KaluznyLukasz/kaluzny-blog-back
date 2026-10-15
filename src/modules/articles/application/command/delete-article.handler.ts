import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ArticleNotFoundError } from '../../model/article-not-found.error';
import { ArticlesRepository } from '../../infra/database/repository/articles.repository';
import { DeleteArticleCommand } from './delete-article.command';

@CommandHandler(DeleteArticleCommand)
export class DeleteArticleHandler implements ICommandHandler<DeleteArticleCommand> {
  constructor(private readonly articlesRepository: ArticlesRepository) {}

  async execute(command: DeleteArticleCommand): Promise<void> {
    const deleted = await this.articlesRepository.delete(command.id);

    if (!deleted) {
      throw new ArticleNotFoundError(command.id);
    }
  }
}
