import { PrismaService } from '../../src/core/prisma/prisma.service';
import { articles } from './articles.seed';
import { images } from './images.seed';

const prisma = new PrismaService();

export async function main() {
  for (const article of articles) {
    await prisma.article.upsert({
      where: { id: article.id },
      update: {},
      create: article,
    });
  }

  for (const image of images) {
    await prisma.image.upsert({
      where: { id: image.id },
      update: {},
      create: image,
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
