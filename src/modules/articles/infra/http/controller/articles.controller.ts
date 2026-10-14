import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { GenericBadRequestResponse } from '../../../../../core/http/response/bad-request.response';
import { GenericNotFoundResponse } from '../../../../../core/http/response/not-found.response';
import { UuidParam } from '../../../../../core/validation/decorator/uuid-v4-param.decorator';
import { GetAllArticlesQuery } from '../../../application/query/get-all-articles.query';
import { GetArticleByIdQuery } from '../../../application/query/get-article-by-id.query';
import {
  ArticleResponse,
  toArticleResponse,
} from '../response/articles.response';

@ApiTags('articles')
@Controller('api/v1/articles')
export class ArticlesController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'Lists all articles, newest first' })
  @ApiOkResponse({
    description:
      'All articles, newest first. Articles published at the same moment are ordered by ID. The list is empty when there are no articles.',
    type: ArticleResponse,
    isArray: true,
  })
  async getAll(): Promise<ArticleResponse[]> {
    const articles = await this.queryBus.execute(new GetAllArticlesQuery());

    return articles.map(toArticleResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Returns one article by its ID' })
  @ApiParam({
    name: 'id',
    description: 'Article ID, a UUID v4',
    format: 'uuid',
    example: '5e1f0a2b-0001-4000-8000-000000000001',
  })
  @ApiOkResponse({
    description: 'The whole article',
    type: ArticleResponse,
  })
  @ApiBadRequestResponse({
    description: 'The ID is not a valid UUID v4',
    type: GenericBadRequestResponse,
  })
  @ApiNotFoundResponse({
    description: 'There is no article with this ID',
    type: GenericNotFoundResponse,
  })
  async getById(@UuidParam('id') id: string): Promise<ArticleResponse> {
    const article = await this.queryBus.execute(new GetArticleByIdQuery(id));

    return toArticleResponse(article);
  }
}
