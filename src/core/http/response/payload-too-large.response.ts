import { ApiProperty } from '@nestjs/swagger';

export class PayloadTooLargeResponse {
  @ApiProperty({
    description: 'Detailed message what went wrong',
    example: 'File too large',
  })
  message: string;

  @ApiProperty({
    description: 'HTTP status message',
    example: 'Payload Too Large',
  })
  error: 'Payload Too Large';

  @ApiProperty({
    description: 'HTTP status code',
    example: 413,
  })
  statusCode: 413;
}
