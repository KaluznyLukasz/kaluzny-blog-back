import { BadRequestException } from '@nestjs/common';

// A 400 shaped like the other validation answers: the wrong field is named in "violations".
export class ArticleImageNotFoundError extends BadRequestException {
  constructor(readonly imageId: string) {
    super({
      statusCode: 400,
      message: 'Request validation failed.',
      error: 'Bad Request',
      violations: { imageId: [`Image with id ${imageId} does not exist.`] },
    });
  }
}
