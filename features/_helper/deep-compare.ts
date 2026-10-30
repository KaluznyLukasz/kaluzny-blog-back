import expect from 'expect';
import { validate as isUuid } from 'uuid';
import * as pack from '../../package.json';

export const deepCompare = (actual: any, expected: any) => {
  if (expected === '@uuid') {
    expect(isUuid(actual)).toBe(true);
    return;
  }

  if (expected === '@current_app_version') {
    validateCurrentAppVersion(actual);
    return;
  }

  // "@image_url" is the address of any image, "@image_url(<id>)" the address of the image with this ID
  const imageUrl =
    typeof expected === 'string' && expected.match(/^@image_url(?:\((.+)\))?$/);

  if (imageUrl) {
    validateImageUrl(actual, imageUrl[1]);
    return;
  }

  if (expected === "@date('within 1 minute from now')") {
    const actualDate = new Date(actual);
    const now = new Date();
    // not in the future
    expect(actualDate.getTime()).toBeLessThan(now.getTime());
    // no more in past than 1 minute
    const diff = Math.abs(actualDate.getTime() - now.getTime());
    expect(diff).toBeLessThan(60 * 1000);

    return;
  }

  if (actual === expected) return;

  if (Array.isArray(expected)) {
    expect(Array.isArray(actual)).toBe(true);
  }

  if (typeof actual !== 'object' || actual === null || expected === null) {
    expect(actual).toBe(expected);
    return;
  }

  const actualKeys = Object.keys(actual);
  const expectedKeys = Object.keys(expected);

  expect(actualKeys.length).toBe(expectedKeys.length);

  for (const key of expectedKeys) {
    expect(actualKeys).toContain(key);
    deepCompare(actual[key], expected[key]);
  }
};

// The app and the scenarios run in the same container, so both see the same PUBLIC_URL
function validateImageUrl(actual: any, id?: string) {
  const prefix = `${(process.env.PUBLIC_URL ?? '').replace(/\/+$/, '')}/api/v1/images/`;

  expect(typeof actual).toBe('string');
  expect(actual.startsWith(prefix)).toBe(true);

  const actualId = actual.slice(prefix.length);

  if (id) {
    expect(actualId).toBe(id);
  } else {
    expect(isUuid(actualId)).toBe(true);
  }
}

function validateCurrentAppVersion(actual: any) {
  expect(typeof actual).toBe('string');
  expect(actual).toBe(pack.version);
}
