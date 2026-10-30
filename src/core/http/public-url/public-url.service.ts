import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// The address the API is published at (the PUBLIC_URL setting) starts every address the API hands out. With no setting
// the addresses are paths only.
@Injectable()
export class PublicUrl {
  private readonly base: string;

  constructor(configService: ConfigService) {
    this.base = configService.get<string>('PUBLIC_URL', '').replace(/\/+$/, '');
  }

  to(path: string): string {
    return `${this.base}/${path}`;
  }
}
