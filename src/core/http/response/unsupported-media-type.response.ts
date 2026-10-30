import { ApiProperty } from '@nestjs/swagger';

export class UnsupportedMediaTypeResponse {
  @ApiProperty({
    description: 'Detailed message what went wrong',
    example: 'The file is not a JPEG, PNG, GIF or WebP image.',
  })
  message: string;

  @ApiProperty({
    description: 'HTTP status message',
    example: 'Unsupported Media Type',
  })
  error: 'Unsupported Media Type';

  @ApiProperty({
    description: 'HTTP status code',
    example: 415,
  })
  statusCode: 415;
}
