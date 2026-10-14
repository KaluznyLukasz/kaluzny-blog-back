import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Article } from '../../model/article.model';
import { ArticleNotFoundError } from '../../model/article-not-found.error';
import { ArticlesRepository } from '../../infra/database/repository/articles.repository';
import { GetArticleByIdQuery } from './get-article-by-id.query';

@QueryHandler(GetArticleByIdQuery)
export class GetArticleByIdHandler implements IQueryHandler<GetArticleByIdQuery> {
  constructor(private readonly articlesRepository: ArticlesRepository) {}

  async execute(query: GetArticleByIdQuery): Promise<Article> {
    const article = await this.articlesRepository.findById(query.id);

    if (!article) {
      throw new ArticleNotFoundError(query.id);
    }

    return article;
  }
}
