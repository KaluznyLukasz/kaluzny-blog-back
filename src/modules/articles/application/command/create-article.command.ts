import { Command } from '@nestjs/cqrs';

export class CreateArticleCommand extends Command<void> {
  constructor(
    readonly id: string,
    readonly title: string,
    readonly content: string,
  ) {
    super();
  }
}
