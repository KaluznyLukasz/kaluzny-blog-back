import { Query } from '@nestjs/cqrs';
import { Article } from '../../model/article.model';

export class GetAllArticlesQuery extends Query<Article[]> {}
