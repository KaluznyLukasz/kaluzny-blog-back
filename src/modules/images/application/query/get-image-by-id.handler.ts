import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ImagesRepository } from '../../infra/database/repository/images.repository';
import { ImageNotFoundError } from '../../model/image-not-found.error';
import { Image } from '../../model/image.model';
import { GetImageByIdQuery } from './get-image-by-id.query';

@QueryHandler(GetImageByIdQuery)
export class GetImageByIdHandler implements IQueryHandler<GetImageByIdQuery> {
  constructor(private readonly imagesRepository: ImagesRepository) {}

  async execute(query: GetImageByIdQuery): Promise<Image> {
    const image = await this.imagesRepository.findById(query.id);

    if (!image) {
      throw new ImageNotFoundError(query.id);
    }

    return image;
  }
}
