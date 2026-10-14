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

| Endpoint                   | Answers                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `GET /api/v1/articles`     | `200` all articles, newest first (an empty list when there are none)               |
| `GET /api/v1/articles/:id` | `200` the article, `400` when the ID is not a valid UUID, `404` when it is unknown |

Every endpoint and response code is documented in Swagger at http://localhost/api.

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
