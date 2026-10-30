import { UnsupportedMediaTypeException } from '@nestjs/common';

export class UnsupportedImageTypeError extends UnsupportedMediaTypeException {
  constructor() {
    super('The file is not a JPEG, PNG, GIF or WebP image.');
  }
}
