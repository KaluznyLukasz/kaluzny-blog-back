import { Command } from '@nestjs/cqrs';

export class DeleteArticleCommand extends Command<void> {
  constructor(readonly id: string) {
    super();
  }
}
