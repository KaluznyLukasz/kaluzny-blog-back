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
