import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isProduction } from '../../consts';

const DEVELOPMENT_ORIGIN = 'http://localhost:5173';

// CORS_ORIGIN is the address of the front end when it is published on another address than the API, several addresses are
// separated with commas. The front end that is served from the address of the API needs no CORS, so in production without
// the setting no other address is allowed.
function allowedOrigin(
  configured: string | undefined,
): string | string[] | false {
  const origins = (configured ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length > 0) {
    return origins;
  }

  return isProduction ? false : DEVELOPMENT_ORIGIN;
}

export function configureCors(app: INestApplication): void {
  app.enableCors({
    origin: allowedOrigin(app.get(ConfigService).get<string>('CORS_ORIGIN')),
    credentials: true, // allow cookies / Authorization headers
    methods: 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });
}
