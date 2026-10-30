// The same bytes as features/_fixtures/pixel.*: scenarios compare a downloaded seed image with the fixture file.
const pixels = {
  png: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  gif: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  webp: 'UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==',
  jpeg: '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
};

function image(
  id: string,
  contentType: string,
  base64: string,
  uploadedAt: string,
) {
  const data = Buffer.from(base64, 'base64');

  return {
    id,
    contentType,
    size: data.length,
    data,
    uploadedAt: new Date(uploadedAt),
  };
}

export const images = [
  image(
    '1ae9e000-0001-4000-8000-000000000001',
    'image/png',
    pixels.png,
    '2025-01-10T09:00:00.000Z',
  ),
  image(
    '1ae9e000-0002-4000-8000-000000000002',
    'image/gif',
    pixels.gif,
    '2025-02-14T12:30:00.000Z',
  ),
  image(
    '1ae9e000-0004-4000-8000-000000000004',
    'image/jpeg',
    pixels.jpeg,
    '2025-03-20T18:00:00.000Z',
  ),
  image(
    '1ae9e000-0003-4000-8000-000000000003',
    'image/webp',
    pixels.webp,
    '2025-03-20T18:00:00.000Z',
  ),
];
