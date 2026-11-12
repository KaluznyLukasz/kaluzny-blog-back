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
| `npm run article:publish -- <file> [--api <url>]`    | Publishes an article from `article-drafts/` with its picture (see "Publishing")     |

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
- The dev entrypoint (`docker/dev/entrypoint`) migrates but does NOT seed: the author's database holds only what they publish, and
  articles they delete stay deleted. The seed (`prisma/seed`) is test data. It is loaded by `Given I use seed data` and by
  `npm run database:seed` (also used by a scenario that seeds twice). Keep it idempotent: fixed UUIDs + `upsert` with
  `update: {}`. Do not put it back into the entrypoint.
- `ts-node` (seed, Cucumber) does not understand `src/...` imports. Anything they import uses relative imports.

## Configuration and secrets

- Settings come from the environment through `ConfigModule` (global, in `AppModule`) and `ConfigService`.
- `.env.dist` is committed and holds development values only (`DATABASE_URL`, `ADMIN_TOKEN="admin-token"`,
  `PUBLIC_URL="http://localhost"`, `CORS_ORIGIN="http://localhost:5173"`). `.env` is git-ignored.
  `CORS_ORIGIN` (front end addresses, comma separated) falls back to `http://localhost:5173` outside production and to "no
  other site" in production, so a `.env` without it keeps working. `PUBLIC_URL` also sets the server address in Swagger.
- `.env.production.dist` is the template of the production settings (empty secrets on purpose, so compose refuses to start
  with them unset). `.env.production` is git-ignored and exists only on the server.
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
  (it also re-runs migrate).
- The dev database lives in the named volume `database-data`: `docker compose down` keeps the data, `down -v` deletes it. A
  database container created before the volume existed keeps its data in an anonymous volume, and the first `up` after the change
  starts an empty one (the old data stays in the orphaned volume, it can be read from a copy of it). Dump before you change
  volumes: `docker compose exec -T database pg_dump -U user -d app | gzip > backups/dev.sql.gz`. To restore a full dump into an
  empty database: stop `app`, `gunzip -c <dump> | docker compose exec -T database psql -U user -d app -v ON_ERROR_STOP=1
--single-transaction -q -o /dev/null`, start `app`.
- `depends_on.database.restart: true` (in `compose.yaml` and `compose.prod.yaml`) makes compose restart `app` whenever it recreates
  `database`. Without it the old `app` container keeps running against a new, empty database without tables and every read is a
  500 ("table public.articles does not exist"), because the migrations only run when the app starts.
- The test suite resets the database (`Given I use seed data`). Never run it against the stack that holds the author's articles:
  use a separate compose project with its own database and no published ports (`COMPOSE_PROJECT_NAME=<other>` plus an override
  file with `ports: !override []`), and remove it with `down -v` afterwards.
- `scripts/` is TypeScript run by `ts-node`, which type-checks at start. `npm run lint` does not type-check, so a type error in a
  script only shows when you run it: run it (`--dry-run` is enough) after every change.
- A single-file bind mount follows the inode: after the file is replaced by an editor or a tool the container still sees the old
  copy. Mount the directory (the Caddyfile is in `docker/prod/caddy/` for this reason).

## Articles module (articles-read-api, #105)

- `GET /api/v1/articles`: 200, all articles, newest first (`publishedAt` desc, then `id` asc for ties). Empty list when none.
- `GET /api/v1/articles/:id`: 200 article, 400 when `:id` is not a UUID v4, 404 when no such article.
- An article: `id` (UUID), `title`, `content`, `publishedAt`, `imageId` (cover image, UUID or `null`), `imageUrl` (address of the cover
  image file or `null`). Same shape in the list and in the single response.

## Articles write API (articles-write-api, #106)

All three need `Authorization: Bearer <ADMIN_TOKEN>`. Reading stays open.

- `POST /api/v1/articles` body `{title, content, imageId?, publishedAt?}`: 201 with the new article. The API sets `id` (random UUID v4).
  `publishedAt` is now unless it is sent.
- `PATCH /api/v1/articles/:id` body with `title`, `content` and/or `imageId` (PATCH, so you send only what changes): 200 with the
  changed article, `publishedAt` never changes. `{}` is allowed and changes nothing. `null` is rejected for `title` and `content`;
  for `imageId` it is the way to remove the cover image.
- `DELETE /api/v1/articles/:id`: 204 without a body. Reading it afterwards gives 404.
- Rules (`infra/http/request/articles.request.ts`, also in Swagger): `title` 3 to 255 characters, `content` 10 to 20000 characters,
  both strings, spaces at the start and end are trimmed before the length check. `imageId` is a UUID v4 of an existing image or
  `null` (`isImageSet` in the same file lets `null` through on purpose).
- `publishedAt` (POST only): an ISO 8601 date and time that ends with a time zone (`Z` or `+01:00`), not in the future
  (`PublishedAtRules` in the same file, `IsNotInFuture` in `src/core/validation/decorator/`). It is there so the author can
  publish older stories with their real date; the date never changes afterwards (PATCH still refuses it). A date without a
  time zone is refused because it would be read in the time zone of the server.
- Unknown fields and the server-owned `id` (and `publishedAt` in a PATCH) give 400 (`whitelist` + `forbidNonWhitelisted` in the
  global `ValidationPipe`). 400 bodies use the template's `violations` list.
- Responses: 401 no token, 403 wrong token, 400 invalid body or ID, 404 unknown ID. Order of checks: token, then ID and body, then
  the database.
- Update uses `@ValidateIf` (not `@IsOptional`) for optional fields: `@IsOptional` would let `null` through to the database.
- A cover image that does not exist is a 400 in the template's `violations` shape (`ArticleImageNotFoundError`, `violations.imageId`).
  The repository turns Prisma's `P2003` (foreign key) into `false` / `'image-not-found'`, so this also holds if the image is deleted
  just before the article is saved. The database does the rest: `articles.image_id` is a foreign key with `ON DELETE SET NULL`, so
  deleting an image leaves its articles without a cover image, and deleting an article never deletes its image.
- Deviation from "the controller returns the model": `ArticleResponse` has an `imageUrl`, built in the controller by `PublicUrl`
  (`src/core/http/public-url`) from `PUBLIC_URL`, the same way as the `url` of an image. The seed article `…0001` has the first seed
  image as its cover image, the others have none.
- The repository turns Prisma's `P2025` (record not found) into `false`, so the handler answers 404 even if the article is deleted
  between two requests. If it is deleted between the command and the query that follows, the query answers 404.
- The front end comes in blog-section (#107).

## Images module (images-upload-api)

Images are uploaded on their own and an article points to one as its cover image (`imageId`). The bytes live in Postgres
(`images.data`, `bytea`), so no extra volume or object storage is needed, and one database backup covers articles and images. The front end shows an article's `content` as plain text (one
`<p>` per line, no Markdown), so never put Markdown or an image address into `content` to get a picture on screen.

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
- Deviation from "the controller returns the model": `ImageResponse` has a `url`, built in the controller by `PublicUrl` from
  `PUBLIC_URL` (see `.env.dist`), because the address depends on where the API is published. With no `PUBLIC_URL` the `url` is a
  path only.
- `article-images/` is where the author drops pictures, `article-drafts/` is where the texts of articles go. Their content is
  git-ignored and not sent to Docker builds (only `.gitkeep` is tracked); inside the container they are `/app/article-images` and
  `/app/article-drafts`. When asked to write an article with a picture from there: look at the files, pick the fitting one, write
  the draft (see "Publishing an article" in `README.md` for the format), check it with `npm run article:publish -- <file> --dry-run`
  and publish it with the same command without `--dry-run`. It uploads the picture, creates the article and removes the picture
  again if the article is refused. Do it against the local dev stack only, never against a production API without being asked,
  and never write a production admin token into a file or a command: the command reads it from `BLOG_ADMIN_TOKEN`, and only
  sends it to `https` addresses and to your own machine. Keep the picture out of `content`.
- An article without a cover image has `imageUrl: null`; the front end then draws a calendar tile with the date (`publishedAt`), so
  nothing has to be written into `content` for it.
- Gotchas:
    - Set the cache headers of the file with `response.set(...)` after the query succeeded. `@Header(...)` is applied before the
      handler runs, so 404 and 400 answers would carry `immutable` too (a scenario checks this).
    - busboy (inside multer) calls a file too large when it REACHES `limits.fileSize`, so the interceptor gets
      `MAX_IMAGE_SIZE + 1` to make 5 MB itself valid (scenarios check both sides of the limit).
    - `Express.Multer.File` needs `@types/multer` (dev dependency).

## Deployment (VPS), see `docs/deployment.md`

Production is one server running `compose.prod.yaml` (project name `kaluzny-blog-prod`, so it never shares containers with the dev
stack): Caddy (HTTPS, serves `./site`, proxies `/api`, `/api-json`), the app (`production` Docker target) and Postgres in a volume.

- One address for everything: `SITE_ADDRESS` in `.env.production` (a domain, or `<ip with dashes>.sslip.io` until there is one).
  Compose builds `PUBLIC_URL=https://${SITE_ADDRESS}` from it. The front end is built with an empty `VITE_API_URL`, so it calls
  the address it is served from and a new domain needs no rebuild. Addresses of images are built from `PUBLIC_URL` when an
  article is read, nothing in the database contains the address of the server.
- The production entrypoint (`docker/prod/entrypoint`) migrates and never seeds. `NODE_ENV=production` is set in the image, which
  makes CORS closed unless `CORS_ORIGIN` is set.
- Do not publish the database or the app port, and never use `http://` for a server (the admin token travels in a header).
- `docker/prod/backup` dumps the database to `backups/` (git-ignored). Restore steps are in `docs/deployment.md`.
- Test changes to these files without a server: build and start the stack in a throwaway project with `SITE_ADDRESS=:80` (any host,
  no certificate), `PUBLIC_URL` set by hand and an override file with `ports: !override ['8080:80']` for `caddy`, then remove it
  with `down -v`. This is how the Caddy routes, the restore and the survival of data over `down` + `up` were checked.
- Not tested without a real server: the HTTPS certificate for an `sslip.io` name or a domain (needs ports 80 and 443 reachable from
  the internet).
