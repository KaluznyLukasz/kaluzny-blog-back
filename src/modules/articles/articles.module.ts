import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { CreateArticleHandler } from './application/command/create-article.handler';
import { DeleteArticleHandler } from './application/command/delete-article.handler';
import { UpdateArticleHandler } from './application/command/update-article.handler';
import { GetAllArticlesHandler } from './application/query/get-all-articles.handler';
import { GetArticleByIdHandler } from './application/query/get-article-by-id.handler';
import { ArticlesRepository } from './infra/database/repository/articles.repository';
import { ArticlesController } from './infra/http/controller/articles.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ArticlesController],
  providers: [
    ArticlesRepository,
    GetAllArticlesHandler,
    GetArticleByIdHandler,
    CreateArticleHandler,
    UpdateArticleHandler,
    DeleteArticleHandler,
  ],
})
export class ArticlesModule {}
