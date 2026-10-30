import { Query } from '@nestjs/cqrs';
import { Image } from '../../model/image.model';

export class GetImageByIdQuery extends Query<Image> {
  constructor(readonly id: string) {
    super();
  }
}
