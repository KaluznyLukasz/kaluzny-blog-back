import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ImagesRepository } from '../../infra/database/repository/images.repository';
import { ImageNotFoundError } from '../../model/image-not-found.error';
import { DeleteImageCommand } from './delete-image.command';

@CommandHandler(DeleteImageCommand)
export class DeleteImageHandler implements ICommandHandler<DeleteImageCommand> {
  constructor(private readonly imagesRepository: ImagesRepository) {}

  async execute(command: DeleteImageCommand): Promise<void> {
    const deleted = await this.imagesRepository.delete(command.id);

    if (!deleted) {
      throw new ImageNotFoundError(command.id);
    }
  }
}
