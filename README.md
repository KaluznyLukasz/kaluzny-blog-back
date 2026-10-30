# Kałużny Blog API

Back end of Łukasz Kałużny's blog: a REST API built with Nest.js and PostgreSQL.

## Tech stack

| Technology | Version |
| ---------- | ------- |
| Node.js    | 24      |
| TypeScript | 5.8     |
| Nest.js    | 11      |
| Prisma     | 7       |
| PostgreSQL | 16      |

Everything runs in Docker containers, described in `compose.yaml`:

| Service    | What it runs        | Address on your machine                 |
| ---------- | ------------------- | --------------------------------------- |
| `app`      | Nest.js API         | http://localhost (port 3000 inside)     |
| `database` | PostgreSQL database | `localhost:5432`, user `user`, db `app` |

## Requirements

- [Git](https://git-scm.com/)
- [Docker](https://docs.docker.com/get-docker/) with Docker Compose

You do not need Node.js on your machine. All `npm`, `npx` and `node` commands run inside the `app` container.

## Getting started

1. Clone the repository:

    ```shell
    git clone https://github.com/KaluznyLukasz/kaluzny-blog-back.git
    cd kaluzny-blog-back
    ```

2. Create your environment file from the template:

    ```shell
    cp .env.dist .env
    ```

    `.env.dist` holds development values only, including a development `ADMIN_TOKEN`. Anywhere else, use your own long
    random value and never commit it. `PUBLIC_URL` is the address the API is published at (no trailing slash): the
    addresses of uploaded images start with it. If you created `.env` before `ADMIN_TOKEN` or `PUBLIC_URL` existed, add
    the line to it and recreate the app container with `docker compose up -d --force-recreate app`.

3. Build and start the containers, and wait until both are healthy:

    ```shell
    docker compose up -d --build --wait
    ```

    On every start the app container installs packages, generates the Prisma client, applies migrations, seeds the
    database and starts Nest.js in watch mode, so code changes reload automatically.

4. Check that it works:
    - http://localhost/ returns the status and the current version, for example `{"status":"OK","version":"0.1.0"}`
    - http://localhost/api shows the Swagger documentation

Useful commands:

```shell
# follow app logs
docker compose logs -f app

# stop the containers
docker compose down
```

## Working in the container

> **Do not run `npm`, `npx` or `node` on your own machine.** Run them in the app container, so everyone uses the same
> Node.js version and the same packages:
>
> ```shell
> docker compose exec app npm run lint
> ```

## Code quality and tests

Run these checks before you push. CI runs the same checks on every pull request.

```shell
# code formatting (Prettier), use format:fix to fix
docker compose exec app npm run format

# static code analysis (ESLint), use lint:fix to fix
docker compose exec app npm run lint

# functional tests (Cucumber)
docker compose exec app npm run test:functional
```

Functional tests live in the `features` directory. They are written in Gherkin and send real HTTP requests to the
running app.

## Database

The schema lives in `prisma/schema.prisma` and seed data in `prisma/seed`. Migrations go to `prisma/migrations`.

```shell
# apply migrations
docker compose exec app npm run database:migrate

# load seed data
docker compose exec app npm run database:seed

# drop all data and apply the migrations again (empty tables, run database:seed afterwards)
docker compose exec app npm run database:reset
```

The seed runs on every start of the app container, so it is idempotent: articles that are already there are left
untouched and missing ones are created.

## API

| Endpoint                      | Admin token | Answers                                                                                      |
| ----------------------------- | ----------- | -------------------------------------------------------------------------------------------- |
| `GET /api/v1/articles`        | no          | `200` all articles, newest first (an empty list when there are none)                         |
| `GET /api/v1/articles/:id`    | no          | `200` the article, `400` when the ID is not a valid UUID, `404` when it is unknown           |
| `POST /api/v1/articles`       | yes         | `201` the new article, `400` for invalid data                                                |
| `PATCH /api/v1/articles/:id`  | yes         | `200` the changed article, `400` for an invalid ID or invalid data, `404` when it is unknown |
| `DELETE /api/v1/articles/:id` | yes         | `204` without a body, `400` for an invalid ID, `404` when it is unknown                      |

Writing needs the header `Authorization: Bearer <ADMIN_TOKEN>`: `401` without a token, `403` with a wrong one. The API sets
the `id` and the `publishedAt` of an article itself, sending them (or any unknown field) is a `400`. A title has 3 to 255
characters and a text 10 to 20000 characters.

Every endpoint and response code is documented in Swagger at http://localhost/api. Click **Authorize**, paste the admin
token (without the word `Bearer`) and you can create, edit and delete articles from there.

### Images

| Endpoint                    | Admin token | Answers                                                                                                                  |
| --------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| `POST /api/v1/images`       | yes         | `201` the image with its `url`, `400` no file or a wrong form, `413` over 5 MB, `415` not a JPEG, PNG, GIF or WebP image |
| `GET /api/v1/images`        | yes         | `200` all images, newest first, with the `url` of each (an empty list when there are none)                               |
| `GET /api/v1/images/:id`    | no          | `200` the image file itself, `400` when the ID is not a valid UUID, `404` when it is unknown                             |
| `DELETE /api/v1/images/:id` | yes         | `204` without a body, `400` for an invalid ID, `404` when it is unknown                                                  |

To upload an image:

1. Open http://localhost/api, click **Authorize** and paste the admin token.
2. Open `POST /api/v1/images`, click **Try it out**, choose the file and click **Execute**.
3. Copy the `url` from the answer: it is the address of the image.

Anyone who has the address can open the image (it is the `src` of an `img` tag, no token needed). Without Swagger:

```shell
# curl, not an npm command, so it runs on your machine
curl -H "Authorization: Bearer $ADMIN_TOKEN" -F "file=@picture.png" http://localhost/api/v1/images
```

The type of an image is read from the content of the file, never from its name, so a text file renamed to `.png` is
refused with `415`. SVG is refused too, because it can carry a script. Images are stored in the database (a `bytea`
column), so one backup covers articles and images. They never change: browsers may keep an image for a year. Deleting an
image that an article still points to leaves a broken image in that article.

## Versioning and releases

The project follows [semantic versioning](https://semver.org/). Every pull request must bump the version in
`package.json`:

- minor version (`0.1.0` → `0.2.0`) for features,
- patch version (`0.1.0` → `0.1.1`) for fixes.

After the bump, update `package-lock.json`:

```shell
docker compose exec app npm install
```

CI fails if the version in `package.json` was already released. Every merge to `main` creates a git tag and a GitHub
release for that version.

## Troubleshooting

- **"Port is already allocated" for 80 or 5432**: another program uses the port, often a local PostgreSQL or another
  Docker project. Stop it and start the containers again.
- **The app does not start**: read the logs with `docker compose logs app`.
- **Windows**: use WSL 2 and keep the repository inside the WSL file system. Make sure Git does not convert line
  endings to CRLF, or the CI check fails.
