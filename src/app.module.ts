import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { StatusController } from 'src/modules/status/status.controller';
import { ArticlesModule } from './modules/articles/articles.module';

@Module({
  imports: [CqrsModule.forRoot(), ArticlesModule],
  controllers: [StatusController],
})
export class AppModule {}
