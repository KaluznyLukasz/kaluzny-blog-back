import { ApiProperty } from '@nestjs/swagger';
import { MAX_IMAGE_SIZE } from '../../../model/image.model';

// Describes the multipart form in Swagger (it gives the "Choose file" button). The file itself is read by the
// FileInterceptor, so nothing here is validated by the ValidationPipe.
export class UploadImageRequest {
  @ApiProperty({
    description: `The image file: JPEG, PNG, GIF or WebP, at most ${MAX_IMAGE_SIZE / 1024 / 1024} MB. The type is found by looking at the content of the file, not at its name.`,
    type: 'string',
    format: 'binary',
  })
  file: Express.Multer.File;
}
