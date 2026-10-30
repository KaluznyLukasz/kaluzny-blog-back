import { Command } from '@nestjs/cqrs';

export class UploadImageCommand extends Command<void> {
  constructor(
    readonly id: string,
    readonly data: Uint8Array,
  ) {
    super();
  }
}
