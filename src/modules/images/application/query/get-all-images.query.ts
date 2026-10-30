import { Query } from '@nestjs/cqrs';
import { Image } from '../../model/image.model';

export class GetAllImagesQuery extends Query<Image[]> {}
