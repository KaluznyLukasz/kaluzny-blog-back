import { NotFoundException } from '@nestjs/common';

export class ImageNotFoundError extends NotFoundException {
  constructor(readonly imageId: string) {
    super(`Image with id ${imageId} does not exist.`);
  }
}
