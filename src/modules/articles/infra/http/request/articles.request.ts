import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsISO8601,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { IsNotInFuture } from '../../../../../core/validation/decorator/is-not-in-future.decorator';

const TITLE_MIN_LENGTH = 3;
const TITLE_MAX_LENGTH = 255;
const CONTENT_MIN_LENGTH = 10;
const CONTENT_MAX_LENGTH = 20000;

const titleDocs = {
  description: `Article title, ${TITLE_MIN_LENGTH} to ${TITLE_MAX_LENGTH} characters. Spaces at the start and at the end are removed before the length is checked.`,
  minLength: TITLE_MIN_LENGTH,
  maxLength: TITLE_MAX_LENGTH,
  example: 'Hello, world: why I started this blog',
};

const contentDocs = {
  description: `Article text, ${CONTENT_MIN_LENGTH} to ${CONTENT_MAX_LENGTH} characters. Spaces at the start and at the end are removed before the length is checked.`,
  minLength: CONTENT_MIN_LENGTH,
  maxLength: CONTENT_MAX_LENGTH,
  example: 'I want a place to write down what I learn while building software.',
};

const imageIdDocs = {
  description:
    'ID of the cover image, a UUID v4 of an image uploaded with POST /api/v1/images. Send null for no cover image.',
  type: String,
  format: 'uuid',
  nullable: true,
  example: '1ae9e000-0001-4000-8000-000000000001',
};

const publishedAtDocs = {
  description:
    'When the article was published, an ISO 8601 date and time that ends with a time zone (Z or an offset like +01:00). It cannot be in the future. Without it the article is published now.',
  type: String,
  format: 'date-time',
  example: '2025-03-20T12:00:00.000Z',
};

// a date and time without a time zone would be read in the time zone of the server
const ENDS_WITH_TIME_ZONE = /(Z|[+-]\d{2}:\d{2})$/;

function trim({ value }: TransformFnParams) {
  return typeof value === 'string' ? value.trim() : value;
}

function isSent(_object: unknown, value: unknown) {
  return value !== undefined;
}

// null is a real answer for the cover image: it means "no image"
function isImageSet(_object: unknown, value: unknown) {
  return value !== undefined && value !== null;
}

function TitleRules() {
  return applyDecorators(
    Transform(trim),
    IsString(),
    MinLength(TITLE_MIN_LENGTH),
    MaxLength(TITLE_MAX_LENGTH),
  );
}

function ContentRules() {
  return applyDecorators(
    Transform(trim),
    IsString(),
    MinLength(CONTENT_MIN_LENGTH),
    MaxLength(CONTENT_MAX_LENGTH),
  );
}

function PublishedAtRules() {
  return applyDecorators(
    IsISO8601({ strict: true }),
    Matches(ENDS_WITH_TIME_ZONE, {
      message:
        'publishedAt must end with a time zone: Z or an offset like +01:00',
    }),
    IsNotInFuture(),
  );
}

export class CreateArticleRequest {
  @ApiProperty(titleDocs)
  @TitleRules()
  title: string;

  @ApiProperty(contentDocs)
  @ContentRules()
  content: string;

  @ApiPropertyOptional(imageIdDocs)
  @ValidateIf(isImageSet)
  @IsUUID('4')
  imageId?: string | null;

  @ApiPropertyOptional(publishedAtDocs)
  @ValidateIf(isSent)
  @PublishedAtRules()
  publishedAt?: string;
}

export class UpdateArticleRequest {
  @ApiPropertyOptional(titleDocs)
  @ValidateIf(isSent)
  @TitleRules()
  title?: string;

  @ApiPropertyOptional(contentDocs)
  @ValidateIf(isSent)
  @ContentRules()
  content?: string;

  @ApiPropertyOptional(imageIdDocs)
  @ValidateIf(isImageSet)
  @IsUUID('4')
  imageId?: string | null;
}
