import { Injectable } from '@nestjs/common';
import type { Article as ArticleRow } from '../../../../../../prisma/client/client';
import { PrismaService } from '../../../../../core/prisma/prisma.service';
import { Article } from '../../../model/article.model';

@Injectable()
export class ArticlesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Article[]> {
    const rows = await this.prisma.article.findMany({
      orderBy: [{ publishedAt: 'desc' }, { id: 'asc' }],
    });

    return rows.map(toArticle);
  }

  async findById(id: string): Promise<Article | null> {
    const row = await this.prisma.article.findUnique({ where: { id } });

    return row ? toArticle(row) : null;
  }
}

function toArticle(row: ArticleRow): Article {
  return new Article(row.id, row.title, row.content, row.publishedAt);
}
