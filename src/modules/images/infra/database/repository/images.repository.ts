import { Injectable } from '@nestjs/common';
import { type Image as ImageRow } from '../../../../../../prisma/client/client';
import { PrismaService } from '../../../../../core/prisma/prisma.service';
import { ImageContentType } from '../../../model/image-content-type';
import { ImageFile } from '../../../model/image-file.model';
import { Image } from '../../../model/image.model';

@Injectable()
export class ImagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Image[]> {
    const rows = await this.prisma.image.findMany({
      omit: { data: true },
      orderBy: [{ uploadedAt: 'desc' }, { id: 'asc' }],
    });

    return rows.map(toImage);
  }

  async findById(id: string): Promise<Image | null> {
    const row = await this.prisma.image.findUnique({
      where: { id },
      omit: { data: true },
    });

    return row ? toImage(row) : null;
  }

  async findFileById(id: string): Promise<ImageFile | null> {
    const row = await this.prisma.image.findUnique({
      where: { id },
      select: { contentType: true, data: true },
    });

    return row
      ? new ImageFile(row.contentType as ImageContentType, row.data)
      : null;
  }

  async create(image: Image, data: Uint8Array): Promise<void> {
    await this.prisma.image.create({
      data: {
        id: image.id,
        contentType: image.contentType,
        size: image.size,
        // Prisma wants a plain ArrayBuffer behind the bytes. A shared one never happens here: the bytes come from a Buffer.
        data: data as Uint8Array<ArrayBuffer>,
        uploadedAt: image.uploadedAt,
      },
    });
  }

  async delete(id: string): Promise<boolean> {
    const { count } = await this.prisma.image.deleteMany({ where: { id } });

    return count > 0;
  }
}

function toImage(row: Omit<ImageRow, 'data'>): Image {
  return new Image(
    row.id,
    row.contentType as ImageContentType,
    row.size,
    row.uploadedAt,
  );
}
