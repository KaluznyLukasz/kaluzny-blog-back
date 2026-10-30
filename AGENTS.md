# AGENTS.md

Back end of Łukasz Kałużny's blog: Nest.js 11, Prisma 7, PostgreSQL 16, Node 24. Everything runs in Docker.

## Rules of work

- Run every `npm`, `npx` and `node` command in the app container: `docker compose exec app <command>`. Never on the host.
- Branch names follow Conventional Branch, for example `feature/articles-read-api-105`.
- Every pull request bumps the version in `package.json` (minor for features, patch for fixes), then
  `docker compose exec app npm install` refreshes `package-lock.json`.
- Do not create a pull request until the owner says so. Do not commit or push unless asked.
- Before finishing run in the container: `npm run format`, `npm run lint`, `npm run test:functional`.

## Commands (all inside the container)

| Command                                              | What it does                                                                        |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `npm run format` / `:fix`                            | Prettier check / write (also formats `.feature` and `.prisma` files)                |
| `npm run lint` / `:fix`                              | ESLint                                                                              |
| `npm run test:functional`                            | Cucumber scenarios from `features/`, real HTTP requests to the running app          |
| `npm run database:migrate`                           | `prisma migrate deploy`                                                             |
| `npm run database:seed`                              | Runs `prisma/seed/seed.ts`                                                          |
| `npm run database:reset`                             | `prisma migrate reset --force`: drops everything, applies migrations, does NOT seed |
| `npx prisma migrate dev --name <name> --create-only` | Creates a migration without applying it                                             |

## Structure

Follows the company structure convention (`src/core`, `src/modules`, nothing else in `src/` except `app.module.ts` and
`main.ts`). Module names are plural and single-word. A bigger module is split into layers:

```
src/modules/<domain>/
├── application/
│   ├── command/         commands and their handlers (CQRS writes)
│   └── query/           queries and their handlers (CQRS reads)
├── infra/
│   ├── database/repository/
│   └── http/{controller,request,response}/
├── model/               domain classes and domain errors
└── <domain>.module.ts
```

- `application` talks to the database only through repositories from `infra`. It never touches HTTP.
- Domain errors extend Nest HTTP exceptions (for example `ArticleNotFoundError extends NotFoundException`) and are thrown in
  `application`; Nest turns them into the HTTP response, controllers need no try/catch.
- Reads go through queries (`QueryBus`), changes go through commands (`CommandBus`). One query or command class, one handler.
  Classes extend `Query<Result>` / `Command<void>` from `@nestjs/cqrs`, so `execute()` is typed.
- No mapper between model and response: the controller returns the `Article` that a query gives. The field docs
  (`@ApiProperty`) live once on `Article`, and `ArticleResponse` is `PickType(Article, [...])` with the fields the API
  exposes. Changing a field's type or docs on `Article` reaches Swagger and the controller types automatically. Renaming
  or removing a field is a compile error at the `PickType` list, so the response cannot drift from the model. The JSON
  contains every property of the object, so do not put private data on `Article`.
- A command never returns data. The controller runs the command, then a query, and answers with the query result. So the
  controller generates the ID of a new article (`randomUUID()`) and passes it in `CreateArticleCommand`, which lets it read
  the article back with `GetArticleByIdQuery`.
- Admin-only endpoints use `@AdminOnly()` (`src/core/http/auth/admin-only.decorator.ts`): `AdminGuard` + Swagger bearer scheme
  `access-token` + the 401 and 403 responses. Guards run before pipes, so a request without a token gets 401 whatever its body
  or ID looks like.
- HTTP APIs keep a version in the path: `/api/v1/...`. Swagger UI is at `/api`, its JSON at `/api-json`.
- Every endpoint documents every response code it can give in Swagger (`@ApiOkResponse`, `@ApiBadRequestResponse`,
  `@ApiNotFoundResponse`, ...). Generic error bodies live in `src/core/http/response/`.
- The generic 400 and 404 classes carry template examples (`registration`, "Resource with given id…") that are wrong for a
  specific endpoint. Give each endpoint real `examples` (see `infra/http/response/articles.examples.ts`) and keep them equal to
  the real answers.

## Naming and style

- File names: kebab-case with the role in the name: `get-all-articles.query.ts`, `articles.repository.ts`,
  `articles.controller.ts`, `article.model.ts`.
- Named exports only, no default exports.
- Named functions use the `function` keyword, not `const x = () => {}`.
- Feature files: `<action>.<domain>.feature`, for example `features/articles/list.articles.feature`.
- Scenario names are user stories (`As a visitor I ...`) and never repeat within a file.
- Each row of a task's "How it should behave" table becomes at least one scenario.

## Database and Prisma 7

- Schema `prisma/schema.prisma`, migrations `prisma/migrations`, generated client `prisma/client/` (git-ignored).
- An applied migration is never edited. Add a new one.
- Tables and columns are snake_case in SQL (`@@map`, `@map`), camelCase in Prisma.
- IDs are UUIDs generated by the client (`@default(uuid())`), not by the database.
- Prisma 7: `migrate reset` has no `--skip-generate`/`--skip-seed` and does not seed. Seed explicitly with `npx prisma db seed`
  (command comes from `migrations.seed` in `prisma.config.ts`).
- The dev entrypoint (`docker/dev/entrypoint`) runs the seed on EVERY container start. Seeds must be idempotent:
  fixed UUIDs + `upsert` with `update: {}`.
- `ts-node` (seed, Cucumber) does not understand `src/...` imports. Anything they import uses relative imports.

## Configuration and secrets

- Settings come from the environment through `ConfigModule` (global, in `AppModule`) and `ConfigService`.
- `.env.dist` is committed and holds development values only (`DATABASE_URL`, `ADMIN_TOKEN="admin-token"`,
  `PUBLIC_URL="http://localhost"`). `.env` is git-ignored.
  After a new setting lands in `.env.dist`, add it to your `.env` and recreate the container:
  `docker compose up -d --force-recreate app` (`restart` does not re-read `.env`).
- Never commit a real secret. Never write a token to a log or an error message.
- No `ADMIN_TOKEN` set means nobody can write (every write gets 403), so a missing setting is safe.

## Tests

- Cucumber steps live in `features/_context/` (HTTP steps in `rest-api.context.ts`, database steps in
  `database.context.ts`), helpers in `features/_helper/`.
- `Given I use seed data` = `prisma migrate reset --force` + `prisma db seed`: the database holds exactly the seed data.
- `Given I use an empty database` = `prisma migrate reset --force`.
- Tokens: `Given I use admin token` (`admin-token`), `Given I use no token` (no `Authorization` header, this is also the default
  after every scenario), `Given I use a wrong token`.
- In a request body `@characters(N)` becomes N letters `a`, for length rules.
- Scenarios that only fail before the database is touched (validation 400, 401, 403) skip `Given I use seed data` to save time.
- The test HTTP client does not keep connections alive (`httpAgent` in `rest-api.context.ts`), otherwise slow
  database-reset steps cause `socket hang up`.
- Multipart: `When I send a "POST" request to "<path>" with the multipart form:` takes a table `field | file | name`. `file` is a
  name from `features/_fixtures/` or `@image(N)` (a PNG padded to N bytes) or `@bytes(N)` (N zero bytes). `name` is the file
  name the client sends, which sets the type it claims.
- Binary: `When I download "<path>"` (bytes, JSON errors are still parsed), `When I download the file at the "url" of the response`,
  `Then the response body should be identical to the file "<fixture>"`, `... should have N bytes`,
  `Then the response header "<name>" should be "<value>"`, `Then the response should not have the header "<name>"`.
  `When I remember the "id" of the response` + `@remembered` in a later path reuses a value. `@image_url` / `@image_url(<id>)`
  in an expected body match an image address (they read `PUBLIC_URL`, the same value the app uses).
- Seed articles (`prisma/seed/articles.seed.ts`) are used as expected data in scenarios. Change them and the features together.
  Two seed articles share one `publishedAt` on purpose, to test the ID tie-breaker in the listing order.

## Gotchas

- `@nestjs/cqrs` must stay on 11.x. 12.x needs Nest 12.
- `nest start --watch` in the container sometimes stops noticing edits made on the host. `docker compose restart app` fixes it
  (it also re-runs migrate and seed, which is a quick check that the seed is idempotent).
- Database container has no volume: `docker compose down` wipes the data.

## Articles module (articles-read-api, #105)

- `GET /api/v1/articles`: 200, all articles, newest first (`publishedAt` desc, then `id` asc for ties). Empty list when none.
- `GET /api/v1/articles/:id`: 200 article, 400 when `:id` is not a UUID v4, 404 when no such article.
- An article: `id` (UUID), `title`, `content`, `publishedAt`. Same shape in the list and in the single response.

## Articles write API (articles-write-api, #106)

All three need `Authorization: Bearer <ADMIN_TOKEN>`. Reading stays open.

- `POST /api/v1/articles` body `{title, content}`: 201 with the new article. The API sets `id` (random UUID v4) and `publishedAt` (now).
- `PATCH /api/v1/articles/:id` body with `title` and/or `content` (PATCH, so you send only what changes): 200 with the changed
  article, `publishedAt` never changes. `{}` is allowed and changes nothing. `null` is rejected.
- `DELETE /api/v1/articles/:id`: 204 without a body. Reading it afterwards gives 404.
- Rules (`infra/http/request/articles.request.ts`, also in Swagger): `title` 3 to 255 characters, `content` 10 to 20000 characters,
  both strings, spaces at the start and end are trimmed before the length check.
- Unknown fields and the server-owned `id` and `publishedAt` give 400 (`whitelist` + `forbidNonWhitelisted` in the global
  `ValidationPipe`). 400 bodies use the template's `violations` list.
- Responses: 401 no token, 403 wrong token, 400 invalid body or ID, 404 unknown ID. Order of checks: token, then ID and body, then
  the database.
- Update uses `@ValidateIf` (not `@IsOptional`) for optional fields: `@IsOptional` would let `null` through to the database.
- The repository turns Prisma's `P2025` (record not found) into `false`, so the handler answers 404 even if the article is deleted
  between two requests. If it is deleted between the command and the query that follows, the query answers 404.
- The front end comes in blog-section (#107).

## Images module (images-upload-api)

Images are separate from articles: the author uploads one and gets its `url`. The bytes live in Postgres (`images.data`,
`bytea`), so no volume or object storage is needed. The front end shows an article's `content` as plain text (one `<p>` per
line, no Markdown), so never put Markdown or an image address into `content` to get a picture on screen.

- `POST /api/v1/images` (admin): `multipart/form-data`, field `file`. 201 `{id, contentType, size, uploadedAt, url}`. 400 no file /
  wrong field name / more than one file, 413 over 5 MB (`MAX_IMAGE_SIZE`), 415 not a JPEG, PNG, GIF or WebP.
- `GET /api/v1/images` (admin): metadata of all images, newest first (`uploadedAt` desc, then `id` asc). It never loads `data`.
- `GET /api/v1/images/:id` (open): the file, with the stored `Content-Type`, a one-year immutable `Cache-Control` and
  `X-Content-Type-Options: nosniff`. 400 not a UUID v4, 404 unknown.
- `DELETE /api/v1/images/:id` (admin): 204, 404 when unknown.
- The type comes from the first bytes of the file (`model/image-content-type.ts`), never from the file name or the part's
  `Content-Type`; that type is what the file is served with. SVG is refused on purpose (it can carry a script).
- `Image` holds metadata only. The bytes travel in `ImageFile`, which only the file download query returns, so they cannot
  reach a JSON answer.
- Deviation from "the controller returns the model": `ImageResponse` has a `url`, built in the controller from `PUBLIC_URL` (see
  `.env.dist`), because the address depends on where the API is published. With no `PUBLIC_URL` the `url` is a path only.
- `article-images/` is where the author drops pictures. Its content is git-ignored and not sent to Docker builds (only
  `.gitkeep` is tracked); inside the container it is `/app/article-images`. When asked to write an article with a picture from
  there: look at the files, pick the fitting one and upload it with `POST /api/v1/images` (admin token). Do it against the
  local dev stack only, never against a production API without being asked.
- The front end already draws a calendar tile with the date (`publishedAt`) for an article, so nothing has to be written into
  `content` for an article without a picture.
- Gotchas:
    - Set the cache headers of the file with `response.set(...)` after the query succeeded. `@Header(...)` is applied before the
      handler runs, so 404 and 400 answers would carry `immutable` too (a scenario checks this).
    - busboy (inside multer) calls a file too large when it REACHES `limits.fileSize`, so the interceptor gets
      `MAX_IMAGE_SIZE + 1` to make 5 MB itself valid (scenarios check both sides of the limit).
    - `Express.Multer.File` needs `@types/multer` (dev dependency).
