import { Injectable } from '@nestjs/common';
import {
  Prisma,
  type Article as ArticleRow,
} from '../../../../../../prisma/client/client';
import { PrismaService } from '../../../../../core/prisma/prisma.service';
import { Article } from '../../../model/article.model';

const RECORD_NOT_FOUND = 'P2025';

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

  async create(article: Article): Promise<Article> {
    const row = await this.prisma.article.create({
      data: {
        id: article.id,
        title: article.title,
        content: article.content,
        publishedAt: article.publishedAt,
      },
    });

    return toArticle(row);
  }

  async update(
    id: string,
    changes: { title?: string; content?: string },
  ): Promise<Article | null> {
    try {
      const row = await this.prisma.article.update({
        where: { id },
        data: changes,
      });

      return toArticle(row);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === RECORD_NOT_FOUND
      ) {
        return null;
      }

      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    const { count } = await this.prisma.article.deleteMany({ where: { id } });

    return count > 0;
  }
}

function toArticle(row: ArticleRow): Article {
  return new Article(row.id, row.title, row.content, row.publishedAt);
}
