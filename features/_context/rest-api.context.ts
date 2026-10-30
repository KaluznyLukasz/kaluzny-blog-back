import { When, Then, Given, After, DataTable } from '@cucumber/cucumber';
import axios, { AxiosResponse } from 'axios';
import expect from 'expect';
import { readFileSync } from 'fs';
import { Agent } from 'http';
import { join } from 'path';
import { deepCompare } from '../_helper/deep-compare';

const apiBaseUrl = 'http://localhost:3000';
const fixturesDirectory = join(__dirname, '..', '_fixtures');
const httpAgent = new Agent({ keepAlive: false });
let apiToken: string | null = null;
let apiResponse: AxiosResponse;
let rememberedValue: string | null = null;

const contentTypes: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  txt: 'text/plain',
};

function authorizationHeader() {
  return apiToken === null ? {} : { Authorization: `Bearer ${apiToken}` };
}

// "@remembered" in a path or in a body stands for the value kept by "I remember the {string} of the response".
function expandRemembered(text: string) {
  return text.replaceAll('@remembered', rememberedValue ?? '@remembered');
}

function expandPath(path: string) {
  return expandRemembered(path);
}

function fixture(fileName: string) {
  return readFileSync(join(fixturesDirectory, fileName));
}

// A file of a multipart form is a name from features/_fixtures or one of:
//   @image(N)  a PNG padded with zeros to N bytes (a real image start, so only its size can be wrong)
//   @bytes(N)  N zero bytes, which are no image at all
function fileToUpload(file: string): { data: Buffer; name: string } {
  const image = file.match(/^@image\((\d+)\)$/);

  if (image) {
    const png = fixture('pixel.png');

    return {
      data: Buffer.concat([png, Buffer.alloc(Number(image[1]) - png.length)]),
      name: 'generated.png',
    };
  }

  const bytes = file.match(/^@bytes\((\d+)\)$/);

  if (bytes) {
    return { data: Buffer.alloc(Number(bytes[1])), name: 'generated.bin' };
  }

  return { data: fixture(file), name: file };
}

function contentTypeOf(fileName: string) {
  return (
    contentTypes[fileName.split('.').pop() ?? ''] ?? 'application/octet-stream'
  );
}

// A file comes as bytes. The errors of the API are still JSON, so they are read as JSON.
function readJsonAnswer(response: AxiosResponse): AxiosResponse {
  const isJson = String(response.headers['content-type']).includes(
    'application/json',
  );

  return isJson
    ? { ...response, data: JSON.parse(Buffer.from(response.data).toString()) }
    : response;
}

async function download(path: string) {
  apiResponse = readJsonAnswer(
    await axios.request({
      method: 'GET',
      url: `${apiBaseUrl}${path}`,
      responseType: 'arraybuffer',
      httpAgent,
      validateStatus: () => true,
      headers: authorizationHeader(),
    }),
  );
}

function expandCharacters(body: string) {
  return body.replace(/@characters\((\d+)\)/g, (_, count) =>
    'a'.repeat(Number(count)),
  );
}

Given('I use admin token', async () => {
  apiToken = 'admin-token';
});

Given('I use no token', () => {
  apiToken = null;
});

Given('I use a wrong token', () => {
  apiToken = 'wrong-token';
});

Given('I use destructive actions token', async () => {
  apiToken = 'destructive-actions-token';
});

When(
  'I send a {string} request to {string}',
  async (method: string, path: string) => {
    const url = `${apiBaseUrl}${expandPath(path)}`;
    apiResponse = await axios.request({
      method: method,
      url: url,
      httpAgent,
      validateStatus: () => true,
      headers: authorizationHeader(),
    });
  },
);

When(
  'I send a {string} request to {string} with body:',
  async (method: string, path: string, body: string) => {
    const url = `${apiBaseUrl}${expandPath(path)}`;
    apiResponse = await axios.request({
      method: method,
      url: url,
      data: JSON.parse(expandRemembered(expandCharacters(body))),
      httpAgent,
      validateStatus: () => true,
      headers: authorizationHeader(),
    });
  },
);

// One row per part of the form. Columns: field (the name of the form field), file (see fileToUpload) and optionally
// name (the file name sent with it, which sets the type the client claims; the API must not trust it).
When(
  'I send a {string} request to {string} with the multipart form:',
  async (method: string, path: string, parts: DataTable) => {
    const form = new FormData();

    for (const part of parts.hashes()) {
      const { data, name } = fileToUpload(part.file);
      const sentName = part.name ?? name;

      form.append(
        part.field,
        new Blob([new Uint8Array(data)], { type: contentTypeOf(sentName) }),
        sentName,
      );
    }

    apiResponse = await axios.request({
      method: method,
      url: `${apiBaseUrl}${expandPath(path)}`,
      data: form,
      httpAgent,
      validateStatus: () => true,
      headers: authorizationHeader(),
    });
  },
);

When('I download {string}', async (path: string) => {
  await download(expandPath(path));
});

When(
  'I download the file at the {string} of the response',
  async (property: string) => {
    const { pathname } = new URL(apiResponse.data[property], apiBaseUrl);

    await download(pathname);
  },
);

When('I remember the {string} of the response', (property: string) => {
  rememberedValue = apiResponse.data[property];
});

Then('the response status should be {int}', (statusCode: number) => {
  expect(apiResponse.status).toBe(statusCode);
});

Then(
  'the response body should have the property {string}',
  (property: string) => {
    expect(apiResponse.data).toHaveProperty(property);
  },
);

Then('the response body should contain:', async function (docString: string) {
  const expected = JSON.parse(docString);
  const actual = apiResponse.data;

  deepCompare(actual, expected);
});

Then(
  'item {int} of the response body should contain:',
  (position: number, docString: string) => {
    deepCompare(apiResponse.data[position - 1], JSON.parse(docString));
  },
);

Then(
  'the response body should list articles in this order:',
  (titles: DataTable) => {
    expect(apiResponse.data.map((article) => article.title)).toEqual(
      titles.raw().flat(),
    );
  },
);

Then('the response body should have {int} items', (count: number) => {
  expect(apiResponse.data).toHaveLength(count);
});

Then('the response body should be empty', () => {
  expect(apiResponse.data).toBe('');
});

Then(
  'the response header {string} should be {string}',
  (name: string, value: string) => {
    expect(apiResponse.headers[name.toLowerCase()]).toBe(value);
  },
);

Then('the response should not have the header {string}', (name: string) => {
  expect(apiResponse.headers[name.toLowerCase()]).toBeUndefined();
});

Then(
  'the response body should be identical to the file {string}',
  (fileName: string) => {
    expect(Buffer.from(apiResponse.data).equals(fixture(fileName))).toBe(true);
  },
);

Then('the response body should have {int} bytes', (count: number) => {
  expect(Buffer.from(apiResponse.data)).toHaveLength(count);
});

Then('I dump response', () => {
  console.log(JSON.stringify(apiResponse.data));
});

After(() => {
  apiToken = null;
  rememberedValue = null;
});
