import { ApiProperty } from '@nestjs/swagger';
import { IMAGE_CONTENT_TYPES, ImageContentType } from './image-content-type';

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// The metadata of an uploaded image. The bytes are not a property of it: they are big, only the download needs them and
// they must never end up in a JSON answer. See ImageFile.
export class Image {
  @ApiProperty({
    description: 'Image ID',
    format: 'uuid',
    example: '1ae9e000-0001-4000-8000-000000000001',
  })
  readonly id: string;

  @ApiProperty({
    description:
      'Type of the image, found by looking at the content of the file',
    enum: IMAGE_CONTENT_TYPES,
    example: 'image/png',
  })
  readonly contentType: ImageContentType;

  @ApiProperty({
    description: 'Size of the file in bytes',
    example: 70,
  })
  readonly size: number;

  @ApiProperty({
    description: 'When the image was uploaded',
    type: String,
    format: 'date-time',
    example: '2025-01-10T09:00:00.000Z',
  })
  readonly uploadedAt: Date;

  constructor(
    id: string,
    contentType: ImageContentType,
    size: number,
    uploadedAt: Date,
  ) {
    this.id = id;
    this.contentType = contentType;
    this.size = size;
    this.uploadedAt = uploadedAt;
  }

  static upload(id: string, contentType: ImageContentType, size: number) {
    return new Image(id, contentType, size, new Date());
  }
}
