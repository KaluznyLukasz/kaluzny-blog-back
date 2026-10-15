import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

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

function trim({ value }: TransformFnParams) {
  return typeof value === 'string' ? value.trim() : value;
}

function isSent(_object: unknown, value: unknown) {
  return value !== undefined;
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
}
