import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Article } from '../../model/article.model';
import { ArticleImageNotFoundError } from '../../model/article-image-not-found.error';
import { ArticlesRepository } from '../../infra/database/repository/articles.repository';
import { CreateArticleCommand } from './create-article.command';

@CommandHandler(CreateArticleCommand)
export class CreateArticleHandler implements ICommandHandler<CreateArticleCommand> {
  constructor(private readonly articlesRepository: ArticlesRepository) {}

  async execute(command: CreateArticleCommand): Promise<void> {
    const created = await this.articlesRepository.create(
      Article.publish(
        command.id,
        command.title,
        command.content,
        command.imageId,
      ),
    );

    if (!created) {
      throw new ArticleImageNotFoundError(command.imageId);
    }
  }
}
