import { Module } from '@nestjs/common';
import { PublicUrl } from './public-url.service';

@Module({
  providers: [PublicUrl],
  exports: [PublicUrl],
})
export class PublicUrlModule {}
