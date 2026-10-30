export const IMAGE_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export type ImageContentType = (typeof IMAGE_CONTENT_TYPES)[number];

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

// The type is read from the first bytes of the file. What the client says (the file name or the Content-Type of the
// part) is never trusted, because it decides which type the file is served with.
export function detectImageContentType(
  data: Uint8Array,
): ImageContentType | null {
  if (hasBytesAt(data, 0, JPEG_SIGNATURE)) {
    return 'image/jpeg';
  }

  if (hasBytesAt(data, 0, PNG_SIGNATURE)) {
    return 'image/png';
  }

  if (
    hasBytesAt(data, 0, ascii('GIF87a')) ||
    hasBytesAt(data, 0, ascii('GIF89a'))
  ) {
    return 'image/gif';
  }

  if (
    hasBytesAt(data, 0, ascii('RIFF')) &&
    hasBytesAt(data, 8, ascii('WEBP'))
  ) {
    return 'image/webp';
  }

  return null;
}

function hasBytesAt(
  data: Uint8Array,
  offset: number,
  bytes: readonly number[],
): boolean {
  return bytes.every((byte, index) => data[offset + index] === byte);
}

function ascii(text: string): number[] {
  return [...text].map((character) => character.charCodeAt(0));
}
