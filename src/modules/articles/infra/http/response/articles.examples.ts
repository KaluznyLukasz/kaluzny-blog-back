export const invalidIdExample = {
  summary: 'The ID is not a valid UUID v4',
  value: {
    message: 'Validation failed (uuid v 4 is expected)',
    error: 'Bad Request',
    statusCode: 400,
  },
};

export const rulesBrokenExample = {
  summary: 'The data breaks a rule',
  value: {
    statusCode: 400,
    message: 'Request validation failed.',
    error: 'Bad Request',
    violations: {
      title: ['title must be longer than or equal to 3 characters'],
      content: ['content must be longer than or equal to 10 characters'],
    },
  },
};

export const invalidImageIdExample = {
  summary: 'The ID of the cover image is not a valid UUID v4',
  value: {
    statusCode: 400,
    message: 'Request validation failed.',
    error: 'Bad Request',
    violations: {
      imageId: ['imageId must be a UUID'],
    },
  },
};

export const unknownImageExample = {
  summary: 'There is no image with the ID sent as the cover image',
  value: {
    statusCode: 400,
    message: 'Request validation failed.',
    error: 'Bad Request',
    violations: {
      imageId: [
        'Image with id 1ae9e000-0001-4000-8000-0000000000ff does not exist.',
      ],
    },
  },
};

export const serverOwnedFieldExample = {
  summary: 'A field owned by the server or an unknown field was sent',
  value: {
    statusCode: 400,
    message: 'Request validation failed.',
    error: 'Bad Request',
    violations: {
      id: ['property id should not exist'],
    },
  },
};

export const articleNotFoundExample = {
  summary: 'There is no article with this ID',
  value: {
    message:
      'Article with id 5e1f0a2b-0001-4000-8000-0000000000ff does not exist.',
    error: 'Not Found',
    statusCode: 404,
  },
};
