// Publishes an article, with an optional cover image, to a running API: the local one or the one on the server.
//
//   npm run article:publish -- article-drafts/my-article.txt [--api <address>] [--dry-run]
//
// The format of the file and the settings are described in "Publishing an article" in README.md.
import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { parseArgs } from 'node:util';

const IMAGES_DIRECTORY = 'article-images';
const LOCAL_API = 'http://localhost:3000';
// host.docker.internal is the machine that runs Docker, seen from the container
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]', 'host.docker.internal'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const IMAGE_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

const USAGE = `Usage: npm run article:publish -- <file> [--api <address>] [--dry-run]

  <file>       the text of the article, for example article-drafts/my-article.txt
  --api        the API to publish to (default: $BLOG_API_URL, or ${LOCAL_API})
  --dry-run    check the file and show what would be published, send nothing

The file starts with a header, one "name: value" per line, then an empty line, then the text:

  title: The beginning of my programming journey
  date: 2023-09-01
  image: zstio.jpg

  The text of the article...

  title   required, 3 to 255 characters
  date    optional, 2023-09-01 or a full date and time like 2023-09-01T12:00:00Z (default: now)
  image   optional, a file from ${IMAGES_DIRECTORY}/, a path, or the ID of an image that is already uploaded

For a server (any address but localhost) use https and set BLOG_ADMIN_TOKEN to its admin token.`;

type Draft = { title: string; content: string; date?: string; image?: string };

class ApiError extends Error {}

function parseDraft(text: string): Draft {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  const separator = normalized.indexOf('\n\n');
  const header = separator === -1 ? normalized : normalized.slice(0, separator);
  const content =
    separator === -1 ? '' : normalized.slice(separator + 2).trim();
  const fields: Record<string, string> = {};

  for (const line of header.split('\n')) {
    const match = /^(title|date|image):\s*(.+)$/.exec(line);

    if (!match) {
      throw new Error(
        `The line "${line}" is not "title: ...", "date: ..." or "image: ...". The header ends with an empty line, the text comes after it.`,
      );
    }

    fields[match[1]] = match[2].trim();
  }

  if (!fields.title) {
    throw new Error('The file has no "title: ..." line at the top.');
  }

  if (!content) {
    throw new Error(
      'The file has no text: put it after an empty line below the header.',
    );
  }

  return {
    title: fields.title,
    content,
    date: fields.date,
    image: fields.image,
  };
}

// A date without a time becomes noon in UTC, so it is the same day in every time zone of Europe and America
function toPublishedAt(date: string | undefined): string | undefined {
  return date && DATE_ONLY.test(date) ? `${date}T12:00:00.000Z` : date;
}

function isLocal(api: URL): boolean {
  return LOCAL_HOSTS.includes(api.hostname);
}

// The token of the local API is in the environment of the dev container. The token of a server never is, it has to be set on purpose.
function tokenFor(api: URL): string {
  const token =
    process.env.BLOG_ADMIN_TOKEN ||
    (isLocal(api) ? process.env.ADMIN_TOKEN : undefined);

  if (!token) {
    throw new Error(
      `Set BLOG_ADMIN_TOKEN to the admin token of ${api.origin}.`,
    );
  }

  return token;
}

function resolveApi(address: string): URL {
  let api: URL;

  try {
    api = new URL(address);
  } catch {
    throw new Error(
      `"${address}" is not an address, for example https://blog.example.com`,
    );
  }

  if (api.protocol !== 'https:' && !isLocal(api)) {
    throw new Error(
      `${api.origin} must use https, otherwise the admin token travels unprotected.`,
    );
  }

  return api;
}

async function readImage(
  image: string,
): Promise<{ bytes: Buffer; name: string; type: string }> {
  const type = IMAGE_TYPES[extname(image).toLowerCase()];

  if (!type) {
    throw new Error(`"${image}" is not a .jpg, .png, .gif or .webp file.`);
  }

  const bytes = await firstReadable([`${IMAGES_DIRECTORY}/${image}`, image]);

  return { bytes, name: basename(image), type };
}

async function firstReadable(paths: string[]): Promise<Buffer> {
  for (const path of paths) {
    try {
      return await readFile(path);
    } catch {
      // try the next place
    }
  }

  throw new Error(`Cannot find the image, looked in: ${paths.join(', ')}`);
}

async function call(
  api: URL,
  token: string,
  path: string,
  init: RequestInit = {},
) {
  let response: Response;

  try {
    response = await fetch(new URL(path, api), {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...init.headers },
    });
  } catch (error) {
    throw new Error(`Cannot reach ${api.origin} (${describeFailure(error)}).`);
  }

  const text = await response.text();
  const body = text ? tryParse(text) : undefined;

  if (!response.ok) {
    const reason = body?.violations
      ? JSON.stringify(body.violations)
      : (body?.message ?? text);
    const hint =
      response.status === 403 ? ' (wrong admin token for this server?)' : '';

    throw new ApiError(`${response.status} ${reason}${hint}`);
  }

  return body;
}

// fetch hides the reason (ECONNREFUSED, a wrong host name, ...) in the cause of its error
function describeFailure(error: unknown): string {
  const { message, cause } = error as {
    message: string;
    cause?: { code?: string; message?: string };
  };

  return cause?.code ?? cause?.message ?? message;
}

function tryParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

async function publish(
  file: string,
  address: string,
  dryRun: boolean,
): Promise<void> {
  const draft = parseDraft(await readFile(file, 'utf8'));
  const publishedAt = toPublishedAt(draft.date);
  const api = resolveApi(address);
  const imageId =
    draft.image && UUID.test(draft.image) ? draft.image : undefined;
  const image =
    draft.image && !imageId ? await readImage(draft.image) : undefined;

  console.log(`${dryRun ? 'would publish' : 'publishing'} to ${api.origin}`);
  console.log(`  title:        ${draft.title}`);
  console.log(`  published at: ${publishedAt ?? 'now'}`);
  console.log(`  text:         ${draft.content.length} characters`);
  console.log(
    `  cover image:  ${image ? `${image.name}, ${image.bytes.length} bytes (will be uploaded)` : (imageId ?? 'none')}`,
  );

  if (dryRun) {
    return;
  }

  const token = tokenFor(api);
  let uploaded: { id: string } | undefined;

  if (image) {
    const form = new FormData();
    form.set(
      'file',
      new Blob([new Uint8Array(image.bytes)], { type: image.type }),
      image.name,
    );
    uploaded = await call(api, token, '/api/v1/images', {
      method: 'POST',
      body: form,
    });
  }

  try {
    const article = await call(api, token, '/api/v1/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: draft.title,
        content: draft.content,
        imageId: uploaded?.id ?? imageId,
        publishedAt,
      }),
    });

    console.log('published');
    console.log(`  id:           ${article.id}`);
    console.log(`  published at: ${article.publishedAt}`);
    console.log(`  cover image:  ${article.imageUrl ?? 'none'}`);
  } catch (error) {
    if (uploaded) {
      await call(api, token, `/api/v1/images/${uploaded.id}`, {
        method: 'DELETE',
      }).catch(() => undefined);
      console.error(
        'The image that was uploaded for this article is removed again.',
      );
    }

    throw error;
  }
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      api: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });

  if (values.help || positionals.length !== 1) {
    console.log(USAGE);
    process.exitCode = values.help ? 0 : 1;

    return;
  }

  try {
    await publish(
      positionals[0],
      values.api ?? process.env.BLOG_API_URL ?? LOCAL_API,
      values['dry-run'],
    );
  } catch (error) {
    console.error(`Nothing was published: ${(error as Error).message}`);
    process.exitCode = 1;
  }
}

void main();
