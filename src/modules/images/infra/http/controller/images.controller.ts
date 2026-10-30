import { randomUUID } from 'crypto';
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  ParseFilePipe,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiPayloadTooLargeResponse,
  ApiTags,
  ApiUnsupportedMediaTypeResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AdminOnly } from '../../../../../core/http/auth/admin-only.decorator';
import { GenericBadRequestResponse } from '../../../../../core/http/response/bad-request.response';
import { PublicUrl } from '../../../../../core/http/public-url/public-url.service';
import { GenericNotFoundResponse } from '../../../../../core/http/response/not-found.response';
import { PayloadTooLargeResponse } from '../../../../../core/http/response/payload-too-large.response';
import { UnsupportedMediaTypeResponse } from '../../../../../core/http/response/unsupported-media-type.response';
import { UuidParam } from '../../../../../core/validation/decorator/uuid-v4-param.decorator';
import { DeleteImageCommand } from '../../../application/command/delete-image.command';
import { UploadImageCommand } from '../../../application/command/upload-image.command';
import { GetAllImagesQuery } from '../../../application/query/get-all-images.query';
import { GetImageByIdQuery } from '../../../application/query/get-image-by-id.query';
import { GetImageFileByIdQuery } from '../../../application/query/get-image-file-by-id.query';
import { IMAGE_CONTENT_TYPES } from '../../../model/image-content-type';
import { Image, MAX_IMAGE_SIZE } from '../../../model/image.model';
import { IMAGES_PATH } from '../images.path';
import { UploadImageRequest } from '../request/images.request';
import {
  fileMissingExample,
  fileTooLargeExample,
  imageNotFoundExample,
  invalidIdExample,
  tooManyFilesExample,
  unsupportedImageTypeExample,
  wrongFieldExample,
} from '../response/images.examples';
import { ImageResponse } from '../response/images.response';

// An image never changes (there is no update, only upload and delete), so it can be kept for as long as browsers allow.
const IMAGE_FILE_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, immutable',
  'X-Content-Type-Options': 'nosniff',
};

const imageIdParam = ApiParam({
  name: 'id',
  description: 'Image ID, a UUID v4',
  format: 'uuid',
  example: '1ae9e000-0001-4000-8000-000000000001',
});

const imageNotFoundResponse = ApiNotFoundResponse({
  description: 'There is no image with this ID',
  type: GenericNotFoundResponse,
  examples: { notFound: imageNotFoundExample },
});

const invalidIdResponse = ApiBadRequestResponse({
  description: 'The ID is not a valid UUID v4',
  type: GenericBadRequestResponse,
  examples: { invalidId: invalidIdExample },
});

@ApiTags('images')
@Controller(IMAGES_PATH)
export class ImagesController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly publicUrl: PublicUrl,
  ) {}

  @Get()
  @AdminOnly()
  @ApiOperation({
    summary: 'Lists all uploaded images, newest first (admin only)',
  })
  @ApiOkResponse({
    description:
      'All images, newest first. Images uploaded at the same moment are ordered by ID. The list is empty when there are no images. It holds no files, only the data about them and where to read them from.',
    type: ImageResponse,
    isArray: true,
  })
  async getAll(): Promise<ImageResponse[]> {
    const images = await this.queryBus.execute(new GetAllImagesQuery());

    return images.map((image) => this.toResponse(image));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Returns the image file, so it can be used as an image address',
  })
  @imageIdParam
  @ApiOkResponse({
    description:
      'The image file itself, with its own Content-Type. Use the address as the src of an img tag. An image never changes, so browsers may keep it for a year.',
    content: Object.fromEntries(
      IMAGE_CONTENT_TYPES.map((type) => [
        type,
        { schema: { type: 'string', format: 'binary' } },
      ]),
    ),
  })
  @invalidIdResponse
  @imageNotFoundResponse
  async getFile(
    @UuidParam('id') id: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const file = await this.queryBus.execute(new GetImageFileByIdQuery(id));

    // Set here, not with @Header: those are set before the handler runs, so an error answer would be cached for a year too.
    response.set(IMAGE_FILE_HEADERS);

    return new StreamableFile(file.data, {
      type: file.contentType,
      length: file.data.length,
    });
  }

  @Post()
  @AdminOnly()
  @ApiOperation({
    summary: 'Uploads an image (admin only)',
    description: `Send the file as multipart/form-data in the field "file". JPEG, PNG, GIF and WebP are accepted, up to ${MAX_IMAGE_SIZE / 1024 / 1024} MB. The answer holds the address of the image (url): paste it into the content of an article.`,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadImageRequest })
  @ApiCreatedResponse({
    description:
      'The uploaded image. The API sets its ID, its type and its upload date.',
    type: ImageResponse,
  })
  @ApiBadRequestResponse({
    description:
      'The request is not a multipart form with exactly one file in the "file" field',
    type: GenericBadRequestResponse,
    examples: {
      fileMissing: fileMissingExample,
      wrongField: wrongFieldExample,
      tooManyFiles: tooManyFilesExample,
    },
  })
  @ApiPayloadTooLargeResponse({
    description: `The file is bigger than ${MAX_IMAGE_SIZE / 1024 / 1024} MB`,
    type: PayloadTooLargeResponse,
    examples: { fileTooLarge: fileTooLargeExample },
  })
  @ApiUnsupportedMediaTypeResponse({
    description:
      'The content of the file is not a JPEG, PNG, GIF or WebP image, whatever the name or the type sent with it says',
    type: UnsupportedMediaTypeResponse,
    examples: { unsupportedImageType: unsupportedImageTypeExample },
  })
  @UseInterceptors(
    // Multer (busboy) calls a file too large as soon as it REACHES the limit, so a file of exactly MAX_IMAGE_SIZE would
    // be refused. One byte more makes the limit inclusive.
    FileInterceptor('file', {
      limits: { fileSize: MAX_IMAGE_SIZE + 1, files: 1 },
    }),
  )
  async upload(
    @UploadedFile(new ParseFilePipe()) file: Express.Multer.File,
  ): Promise<ImageResponse> {
    const id = randomUUID();

    await this.commandBus.execute(new UploadImageCommand(id, file.buffer));

    return this.toResponse(
      await this.queryBus.execute(new GetImageByIdQuery(id)),
    );
  }

  @Delete(':id')
  @AdminOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deletes an image (admin only)',
    description:
      'Articles that still point to the image show a broken image afterwards.',
  })
  @imageIdParam
  @ApiNoContentResponse({ description: 'The image is deleted' })
  @invalidIdResponse
  @imageNotFoundResponse
  async remove(@UuidParam('id') id: string): Promise<void> {
    await this.commandBus.execute(new DeleteImageCommand(id));
  }

  // The address depends on where the API is published (PUBLIC_URL), which the model does not know, so it is added here.
  private toResponse(image: Image): ImageResponse {
    return { ...image, url: this.publicUrl.to(`${IMAGES_PATH}/${image.id}`) };
  }
}
