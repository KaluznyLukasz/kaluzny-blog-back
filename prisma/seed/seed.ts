import { PrismaService } from '../../src/core/prisma/prisma.service';
import { articles } from './articles.seed';

const prisma = new PrismaService();

export async function main() {
  for (const article of articles) {
    await prisma.article.upsert({
      where: { id: article.id },
      update: {},
      create: article,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    await prisma.$disconnect();
    console.error(e);
    process.exit(1);
  });
