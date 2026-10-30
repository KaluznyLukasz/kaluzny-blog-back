import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ArticleImageNotFoundError } from '../../model/article-image-not-found.error';
import { ArticleNotFoundError } from '../../model/article-not-found.error';
import { ArticlesRepository } from '../../infra/database/repository/articles.repository';
import { UpdateArticleCommand } from './update-article.command';

@CommandHandler(UpdateArticleCommand)
export class UpdateArticleHandler implements ICommandHandler<UpdateArticleCommand> {
  constructor(private readonly articlesRepository: ArticlesRepository) {}

  async execute(command: UpdateArticleCommand): Promise<void> {
    const result = await this.articlesRepository.update(command.id, {
      title: command.title,
      content: command.content,
      imageId: command.imageId,
    });

    if (result === 'article-not-found') {
      throw new ArticleNotFoundError(command.id);
    }

    if (result === 'image-not-found') {
      throw new ArticleImageNotFoundError(command.imageId);
    }
  }
}
