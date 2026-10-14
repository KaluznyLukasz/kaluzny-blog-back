import { Query } from '@nestjs/cqrs';
import { Article } from '../../model/article.model';

export class GetArticleByIdQuery extends Query<Article> {
  constructor(readonly id: string) {
    super();
  }
}
