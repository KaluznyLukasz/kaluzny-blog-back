import { ApiProperty, PickType } from '@nestjs/swagger';
import { Image } from '../../../model/image.model';

export class ImageResponse extends PickType(Image, [
  'id',
  'contentType',
  'size',
  'uploadedAt',
] as const) {
  @ApiProperty({
    description:
      'Where the file can be read from. Anyone can open it, paste it into the content of an article.',
    example:
      'http://localhost/api/v1/images/1ae9e000-0001-4000-8000-000000000001',
  })
  readonly url: string;
}
