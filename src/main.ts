import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { configureInputValidation } from './core/validation/validation.config';
import { configureSwagger } from './core/http/swagger/swagger.config';
import { configureCors } from './core/http/cors/cors.config';
import { INestApplication } from '@nestjs/common';

(async function bootstrap() {
  const app: INestApplication<AppModule> = await NestFactory.create(AppModule);

  configureInputValidation(app);
  configureSwagger(app);
  configureCors(app);

  await app.listen(3000);
})();
