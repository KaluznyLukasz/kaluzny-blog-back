import { applyDecorators, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ForbiddenResponse } from '../response/forbidden.response';
import { UnauthorizedResponse } from '../response/unauthorized.response';
import { AdminGuard } from './admin.guard';

export function AdminOnly() {
  return applyDecorators(
    UseGuards(AdminGuard),
    ApiBearerAuth('access-token'),
    ApiUnauthorizedResponse({
      description: 'No admin token was sent',
      type: UnauthorizedResponse,
    }),
    ApiForbiddenResponse({
      description: 'The token is not the admin token',
      type: ForbiddenResponse,
    }),
  );
}
