export const invalidIdExample = {
  summary: 'The ID is not a valid UUID v4',
  value: {
    message: 'Validation failed (uuid v 4 is expected)',
    error: 'Bad Request',
    statusCode: 400,
  },
};

export const fileMissingExample = {
  summary: 'No file was sent in the "file" field',
  value: {
    message: 'File is required',
    error: 'Bad Request',
    statusCode: 400,
  },
};

export const wrongFieldExample = {
  summary: 'The file was sent in a field with another name',
  value: {
    message: 'Unexpected field - photo',
    error: 'Bad Request',
    statusCode: 400,
  },
};

export const tooManyFilesExample = {
  summary: 'More than one file was sent',
  value: {
    message: 'Too many files',
    error: 'Bad Request',
    statusCode: 400,
  },
};

export const imageNotFoundExample = {
  summary: 'There is no image with this ID',
  value: {
    message:
      'Image with id 1ae9e000-0001-4000-8000-0000000000ff does not exist.',
    error: 'Not Found',
    statusCode: 404,
  },
};

export const fileTooLargeExample = {
  summary: 'The file is bigger than the limit',
  value: {
    message: 'File too large',
    error: 'Payload Too Large',
    statusCode: 413,
  },
};

export const unsupportedImageTypeExample = {
  summary: 'The file is not a supported image',
  value: {
    message: 'The file is not a JPEG, PNG, GIF or WebP image.',
    error: 'Unsupported Media Type',
    statusCode: 415,
  },
};
