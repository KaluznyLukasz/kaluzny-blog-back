import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Article } from '../../model/article.model';
import { ArticlesRepository } from '../../infra/database/repository/articles.repository';
import { GetAllArticlesQuery } from './get-all-articles.query';

@QueryHandler(GetAllArticlesQuery)
export class GetAllArticlesHandler implements IQueryHandler<GetAllArticlesQuery> {
  constructor(private readonly articlesRepository: ArticlesRepository) {}

  execute(): Promise<Article[]> {
    return this.articlesRepository.findAll();
  }
}
