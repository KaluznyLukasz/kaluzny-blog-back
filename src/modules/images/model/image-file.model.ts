import { ImageContentType } from './image-content-type';

export class ImageFile {
  constructor(
    readonly contentType: ImageContentType,
    readonly data: Uint8Array,
  ) {}
}
