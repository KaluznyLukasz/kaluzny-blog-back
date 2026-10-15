import { Command } from '@nestjs/cqrs';

export class UpdateArticleCommand extends Command<void> {
  constructor(
    readonly id: string,
    readonly title?: string,
    readonly content?: string,
  ) {
    super();
  }
}
