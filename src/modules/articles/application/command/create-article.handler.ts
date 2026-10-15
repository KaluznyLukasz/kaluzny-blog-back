import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Article } from '../../model/article.model';
import { ArticlesRepository } from '../../infra/database/repository/articles.repository';
import { CreateArticleCommand } from './create-article.command';

@CommandHandler(CreateArticleCommand)
export class CreateArticleHandler implements ICommandHandler<CreateArticleCommand> {
  constructor(private readonly articlesRepository: ArticlesRepository) {}

  async execute(command: CreateArticleCommand): Promise<void> {
    await this.articlesRepository.create(
      Article.publish(command.id, command.title, command.content),
    );
  }
}
