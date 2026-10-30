import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ImagesRepository } from '../../infra/database/repository/images.repository';
import { ImageFile } from '../../model/image-file.model';
import { ImageNotFoundError } from '../../model/image-not-found.error';
import { GetImageFileByIdQuery } from './get-image-file-by-id.query';

@QueryHandler(GetImageFileByIdQuery)
export class GetImageFileByIdHandler implements IQueryHandler<GetImageFileByIdQuery> {
  constructor(private readonly imagesRepository: ImagesRepository) {}

  async execute(query: GetImageFileByIdQuery): Promise<ImageFile> {
    const file = await this.imagesRepository.findFileById(query.id);

    if (!file) {
      throw new ImageNotFoundError(query.id);
    }

    return file;
  }
}
