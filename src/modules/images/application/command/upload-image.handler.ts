import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ImagesRepository } from '../../infra/database/repository/images.repository';
import { detectImageContentType } from '../../model/image-content-type';
import { Image } from '../../model/image.model';
import { UnsupportedImageTypeError } from '../../model/unsupported-image-type.error';
import { UploadImageCommand } from './upload-image.command';

@CommandHandler(UploadImageCommand)
export class UploadImageHandler implements ICommandHandler<UploadImageCommand> {
  constructor(private readonly imagesRepository: ImagesRepository) {}

  async execute(command: UploadImageCommand): Promise<void> {
    const contentType = detectImageContentType(command.data);

    if (!contentType) {
      throw new UnsupportedImageTypeError();
    }

    await this.imagesRepository.create(
      Image.upload(command.id, contentType, command.data.length),
      command.data,
    );
  }
}
