import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

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
