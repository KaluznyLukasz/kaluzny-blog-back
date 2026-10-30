import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { StatusController } from 'src/modules/status/status.controller';
import { ArticlesModule } from './modules/articles/articles.module';
import { ImagesModule } from './modules/images/images.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CqrsModule.forRoot(),
    ArticlesModule,
    ImagesModule,
  ],
  controllers: [StatusController],
})
export class AppModule {}
