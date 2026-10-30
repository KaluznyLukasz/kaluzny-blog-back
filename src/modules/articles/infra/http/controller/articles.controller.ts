import { randomUUID } from 'crypto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AdminOnly } from '../../../../../core/http/auth/admin-only.decorator';
import { PublicUrl } from '../../../../../core/http/public-url/public-url.service';
import { GenericBadRequestResponse } from '../../../../../core/http/response/bad-request.response';
import { GenericNotFoundResponse } from '../../../../../core/http/response/not-found.response';
import { UuidParam } from '../../../../../core/validation/decorator/uuid-v4-param.decorator';
import { IMAGES_PATH } from '../../../../images/infra/http/images.path';
import { CreateArticleCommand } from '../../../application/command/create-article.command';
import { DeleteArticleCommand } from '../../../application/command/delete-article.command';
import { UpdateArticleCommand } from '../../../application/command/update-article.command';
import { GetAllArticlesQuery } from '../../../application/query/get-all-articles.query';
import { GetArticleByIdQuery } from '../../../application/query/get-article-by-id.query';
import { Article } from '../../../model/article.model';
import {
  CreateArticleRequest,
  UpdateArticleRequest,
} from '../request/articles.request';
import {
  articleNotFoundExample,
  invalidIdExample,
  invalidImageIdExample,
  rulesBrokenExample,
  serverOwnedFieldExample,
  unknownImageExample,
} from '../response/articles.examples';
import { ArticleResponse } from '../response/articles.response';

const articleIdParam = ApiParam({
  name: 'id',
  description: 'Article ID, a UUID v4',
  format: 'uuid',
  example: '5e1f0a2b-0001-4000-8000-000000000001',
});

const articleNotFoundResponse = ApiNotFoundResponse({
  description: 'There is no article with this ID',
  type: GenericNotFoundResponse,
  examples: { notFound: articleNotFoundExample },
});

const invalidIdResponse = ApiBadRequestResponse({
  description: 'The ID is not a valid UUID v4',
  type: GenericBadRequestResponse,
  examples: { invalidId: invalidIdExample },
});

@ApiTags('articles')
@Controller('api/v1/articles')
export class ArticlesController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly publicUrl: PublicUrl,
  ) {}

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

    return articles.map((article) => this.toResponse(article));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Returns one article by its ID' })
  @articleIdParam
  @ApiOkResponse({
    description: 'The whole article',
    type: ArticleResponse,
  })
  @invalidIdResponse
  @articleNotFoundResponse
  async getById(@UuidParam('id') id: string): Promise<ArticleResponse> {
    return this.toResponse(
      await this.queryBus.execute(new GetArticleByIdQuery(id)),
    );
  }

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Creates an article (admin only)' })
  @ApiCreatedResponse({
    description:
      'The new article. The API sets its ID and its publication date.',
    type: ArticleResponse,
  })
  @ApiBadRequestResponse({
    description:
      'The data breaks a rule, has unknown fields or has fields owned by the server (id, publishedAt), or the cover image does not exist. Every wrong field is listed in violations.',
    type: GenericBadRequestResponse,
    examples: {
      rulesBroken: rulesBrokenExample,
      serverOwnedField: serverOwnedFieldExample,
      invalidImageId: invalidImageIdExample,
      unknownImage: unknownImageExample,
    },
  })
  async create(
    @Body() request: CreateArticleRequest,
  ): Promise<ArticleResponse> {
    const id = randomUUID();

    await this.commandBus.execute(
      new CreateArticleCommand(
        id,
        request.title,
        request.content,
        request.imageId ?? null,
      ),
    );

    return this.toResponse(
      await this.queryBus.execute(new GetArticleByIdQuery(id)),
    );
  }

  @Patch(':id')
  @AdminOnly()
  @ApiOperation({
    summary: 'Changes the title and/or the content of an article (admin only)',
  })
  @articleIdParam
  @ApiOkResponse({
    description:
      'The changed article. Only the fields that were sent change, the publication date always stays the same. A body without fields changes nothing.',
    type: ArticleResponse,
  })
  @ApiBadRequestResponse({
    description:
      'The ID is not a valid UUID v4, or the data breaks a rule, has unknown fields or has fields owned by the server (id, publishedAt), or the cover image does not exist. Every wrong field is listed in violations.',
    type: GenericBadRequestResponse,
    examples: {
      invalidId: invalidIdExample,
      rulesBroken: rulesBrokenExample,
      serverOwnedField: serverOwnedFieldExample,
      invalidImageId: invalidImageIdExample,
      unknownImage: unknownImageExample,
    },
  })
  @articleNotFoundResponse
  async update(
    @UuidParam('id') id: string,
    @Body() request: UpdateArticleRequest,
  ): Promise<ArticleResponse> {
    await this.commandBus.execute(
      new UpdateArticleCommand(
        id,
        request.title,
        request.content,
        request.imageId,
      ),
    );

    return this.toResponse(
      await this.queryBus.execute(new GetArticleByIdQuery(id)),
    );
  }

  @Delete(':id')
  @AdminOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletes an article (admin only)' })
  @articleIdParam
  @ApiNoContentResponse({ description: 'The article is deleted' })
  @invalidIdResponse
  @articleNotFoundResponse
  async remove(@UuidParam('id') id: string): Promise<void> {
    await this.commandBus.execute(new DeleteArticleCommand(id));
  }

  // The address of the cover image depends on where the API is published (PUBLIC_URL), which the model does not know, so
  // it is added here.
  private toResponse(article: Article): ArticleResponse {
    return {
      ...article,
      imageUrl: article.imageId
        ? this.publicUrl.to(`${IMAGES_PATH}/${article.imageId}`)
        : null,
    };
  }
}
