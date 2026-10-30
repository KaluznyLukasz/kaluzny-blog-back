import { Command } from '@nestjs/cqrs';

export class UpdateArticleCommand extends Command<void> {
  constructor(
    readonly id: string,
    readonly title?: string,
    readonly content?: string,
    // undefined leaves the cover image as it is, null removes it
    readonly imageId?: string | null,
  ) {
    super();
  }
}
