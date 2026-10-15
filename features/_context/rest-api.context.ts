import { When, Then, Given, After, DataTable } from '@cucumber/cucumber';
import axios, { AxiosResponse } from 'axios';
import expect from 'expect';
import { Agent } from 'http';
import { deepCompare } from '../_helper/deep-compare';

const apiBaseUrl = 'http://localhost:3000';
const httpAgent = new Agent({ keepAlive: false });
let apiToken: string | null = null;
let apiResponse: AxiosResponse;

function authorizationHeader() {
  return apiToken === null ? {} : { Authorization: `Bearer ${apiToken}` };
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
    const url = `${apiBaseUrl}${path}`;
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
    const url = `${apiBaseUrl}${path}`;
    apiResponse = await axios.request({
      method: method,
      url: url,
      data: JSON.parse(expandCharacters(body)),
      httpAgent,
      validateStatus: () => true,
      headers: authorizationHeader(),
    });
  },
);

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

Then('I dump response', () => {
  console.log(JSON.stringify(apiResponse.data));
});

After(() => {
  apiToken = null;
});
