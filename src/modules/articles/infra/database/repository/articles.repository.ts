import { Injectable } from '@nestjs/common';
import {
  Prisma,
  type Article as ArticleRow,
} from '../../../../../../prisma/client/client';
import { PrismaService } from '../../../../../core/prisma/prisma.service';
import { Article } from '../../../model/article.model';

const RECORD_NOT_FOUND = 'P2025';
const FOREIGN_KEY_VIOLATION = 'P2003';

export type UpdateResult = 'updated' | 'article-not-found' | 'image-not-found';

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

  // false when the cover image does not exist (also when it is deleted just before the article is saved)
  async create(article: Article): Promise<boolean> {
    try {
      await this.prisma.article.create({
        data: {
          id: article.id,
          title: article.title,
          content: article.content,
          publishedAt: article.publishedAt,
          imageId: article.imageId,
        },
      });

      return true;
    } catch (error) {
      if (isKnownError(error, FOREIGN_KEY_VIOLATION)) {
        return false;
      }

      throw error;
    }
  }

  async update(
    id: string,
    changes: { title?: string; content?: string; imageId?: string | null },
  ): Promise<UpdateResult> {
    try {
      await this.prisma.article.update({ where: { id }, data: changes });

      return 'updated';
    } catch (error) {
      if (isKnownError(error, RECORD_NOT_FOUND)) {
        return 'article-not-found';
      }

      if (isKnownError(error, FOREIGN_KEY_VIOLATION)) {
        return 'image-not-found';
      }

      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    const { count } = await this.prisma.article.deleteMany({ where: { id } });

    return count > 0;
  }
}

function isKnownError(error: unknown, code: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}

function toArticle(row: ArticleRow): Article {
  return new Article(
    row.id,
    row.title,
    row.content,
    row.publishedAt,
    row.imageId,
  );
}
