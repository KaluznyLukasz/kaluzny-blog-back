import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { GetAllArticlesHandler } from './application/query/get-all-articles.handler';
import { GetArticleByIdHandler } from './application/query/get-article-by-id.handler';
import { ArticlesRepository } from './infra/database/repository/articles.repository';
import { ArticlesController } from './infra/http/controller/articles.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ArticlesController],
  providers: [ArticlesRepository, GetAllArticlesHandler, GetArticleByIdHandler],
})
export class ArticlesModule {}
