import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ImagesRepository } from '../../infra/database/repository/images.repository';
import { Image } from '../../model/image.model';
import { GetAllImagesQuery } from './get-all-images.query';

@QueryHandler(GetAllImagesQuery)
export class GetAllImagesHandler implements IQueryHandler<GetAllImagesQuery> {
  constructor(private readonly imagesRepository: ImagesRepository) {}

  execute(): Promise<Image[]> {
    return this.imagesRepository.findAll();
  }
}
