import { ApiProperty } from '@nestjs/swagger';

export class GetStatusResponse {
  @ApiProperty({ example: 'OK' })
  status: 'OK';

  @ApiProperty({ example: '1.0.0' })
  version: string;
}
