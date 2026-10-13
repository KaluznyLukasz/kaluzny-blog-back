import { Controller, Get, HttpStatus } from '@nestjs/common';
import { GetStatusResponse } from 'src/modules/status/dto/get-status.dto';
import * as pack from '../../../package.json';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('status')
@Controller('/')
export class StatusController {
  @Get()
  @ApiOperation({ summary: 'Returns app status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application is running correctly',
    type: GetStatusResponse,
  })
  getStatus(): GetStatusResponse {
    return { status: 'OK', version: pack.version };
  }
}
