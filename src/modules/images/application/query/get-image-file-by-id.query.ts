import { Query } from '@nestjs/cqrs';
import { ImageFile } from '../../model/image-file.model';

export class GetImageFileByIdQuery extends Query<ImageFile> {
  constructor(readonly id: string) {
    super();
  }
}
