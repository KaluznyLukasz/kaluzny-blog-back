import { Command } from '@nestjs/cqrs';

export class DeleteImageCommand extends Command<void> {
  constructor(readonly id: string) {
    super();
  }
}
