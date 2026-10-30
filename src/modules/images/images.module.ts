import { Module } from '@nestjs/common';
import { PublicUrlModule } from '../../core/http/public-url/public-url.module';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { DeleteImageHandler } from './application/command/delete-image.handler';
import { UploadImageHandler } from './application/command/upload-image.handler';
import { GetAllImagesHandler } from './application/query/get-all-images.handler';
import { GetImageByIdHandler } from './application/query/get-image-by-id.handler';
import { GetImageFileByIdHandler } from './application/query/get-image-file-by-id.handler';
import { ImagesRepository } from './infra/database/repository/images.repository';
import { ImagesController } from './infra/http/controller/images.controller';

@Module({
  imports: [PrismaModule, PublicUrlModule],
  controllers: [ImagesController],
  providers: [
    ImagesRepository,
    GetAllImagesHandler,
    GetImageByIdHandler,
    GetImageFileByIdHandler,
    UploadImageHandler,
    DeleteImageHandler,
  ],
})
export class ImagesModule {}
