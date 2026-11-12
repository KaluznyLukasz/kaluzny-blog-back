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
    addresses of uploaded images start with it. `CORS_ORIGIN` is the address of the front end (its dev server), the only
    address that may call the API from a browser; without it that is the default. If you created `.env` before
    `ADMIN_TOKEN` or `PUBLIC_URL` existed, add the line to it and recreate the app container with
    `docker compose up -d --force-recreate app`.

3. Build and start the containers, and wait until both are healthy:

    ```shell
    docker compose up -d --build --wait
    ```

    On every start the app container installs packages, generates the Prisma client, applies migrations and starts
    Nest.js in watch mode, so code changes reload automatically. The database starts empty: it holds only what you
    publish (see [Publishing an article](#publishing-an-article)).

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

The schema lives in `prisma/schema.prisma` and sample data in `prisma/seed`. Migrations go to `prisma/migrations`.

```shell
# apply migrations
docker compose exec app npm run database:migrate

# load the sample data (only if you want sample articles and images)
docker compose exec app npm run database:seed

# drop all data and apply the migrations again (empty tables)
docker compose exec app npm run database:reset
```

The sample data is for the tests. Nothing loads it when the app starts, so your database holds only what you publish. The
tests load it themselves (`Given I use seed data`), which also resets the database: never run them against the stack that
holds your articles.

The data lives in the Docker volume `database-data`, so it survives `docker compose stop`, `down` and a rebuild.
`docker compose down -v` deletes the volume and with it every article and image.

> A database container created before this volume existed keeps its data in an anonymous volume, and the first
> `docker compose up -d` after the change starts a new, empty database. Before you pull this change, save your data:
> `docker compose exec -T database pg_dump -U user -d app | gzip > backup.sql.gz`.

## API

| Endpoint                      | Admin token | Answers                                                                                      |
| ----------------------------- | ----------- | -------------------------------------------------------------------------------------------- |
| `GET /api/v1/articles`        | no          | `200` all articles, newest first (an empty list when there are none)                         |
| `GET /api/v1/articles/:id`    | no          | `200` the article, `400` when the ID is not a valid UUID, `404` when it is unknown           |
| `POST /api/v1/articles`       | yes         | `201` the new article, `400` for invalid data                                                |
| `PATCH /api/v1/articles/:id`  | yes         | `200` the changed article, `400` for an invalid ID or invalid data, `404` when it is unknown |
| `DELETE /api/v1/articles/:id` | yes         | `204` without a body, `400` for an invalid ID, `404` when it is unknown                      |

Writing needs the header `Authorization: Bearer <ADMIN_TOKEN>`: `401` without a token, `403` with a wrong one. The API sets
the `id` of an article itself, sending it (or any unknown field) is a `400`. `publishedAt` is now unless you send one when
you create the article: an ISO 8601 date and time with a time zone (`2023-09-01T12:00:00Z`), not in the future. It cannot be
changed afterwards. A title has 3 to 255 characters and a text 10 to 20000 characters. An article can have a cover image: send the `imageId` of an uploaded image (see
[Images](#images)). Every article answer has `imageId` and `imageUrl`, both `null` when there is no cover image.

Every endpoint and response code is documented in Swagger at http://localhost/api. Click **Authorize**, paste the admin
token (without the word `Bearer`) and you can create, edit and delete articles from there.

### Images

| Endpoint                    | Admin token | Answers                                                                                                                  |
| --------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| `POST /api/v1/images`       | yes         | `201` the image with its `url`, `400` no file or a wrong form, `413` over 5 MB, `415` not a JPEG, PNG, GIF or WebP image |
| `GET /api/v1/images`        | yes         | `200` all images, newest first, with the `url` of each (an empty list when there are none)                               |
| `GET /api/v1/images/:id`    | no          | `200` the image file itself, `400` when the ID is not a valid UUID, `404` when it is unknown                             |
| `DELETE /api/v1/images/:id` | yes         | `204` without a body, `400` for an invalid ID, `404` when it is unknown                                                  |

To give an article a cover image:

1. Open http://localhost/api, click **Authorize** and paste the admin token.
2. Open `POST /api/v1/images`, click **Try it out**, choose the file and click **Execute**. Copy the `id` from the answer (the
   `url` is the address of the image file).
3. Send that `id` as `imageId`: in `POST /api/v1/articles` for a new article, or in `PATCH /api/v1/articles/{id}` for an existing
   one. The answer then has the `imageUrl` of the cover image. `"imageId": null` in a `PATCH` removes it.

Anyone who has the address can open the image (it is the `src` of an `img` tag, no token needed). Without Swagger:

```shell
# curl, not an npm command, so it runs on your machine
curl -H "Authorization: Bearer $ADMIN_TOKEN" -F "file=@picture.png" http://localhost/api/v1/images
```

The type of an image is read from the content of the file, never from its name, so a text file renamed to `.png` is
refused with `415`. SVG is refused too, because it can carry a script. Images are stored in the database (a `bytea`
column), so one backup covers articles and images. They never change: browsers may keep an image for a year. Deleting an
image removes it as the cover image of its articles (they stay), and deleting an article keeps its image.

## Publishing an article

The easy way to add an article, with a picture, to your local API or to the one on the server: write the text in a file, drop
the picture into a folder, run one command. It uploads the picture and creates the article with it as the cover image.

1. Put the picture in `article-images/` (git-ignored).
2. Write the article in `article-drafts/<name>.txt` (git-ignored). A header, an empty line, then the text:

    ```
    title: The beginning of my programming journey
    date: 2023-09-01
    image: zstio.jpg

    The first paragraph of the article.

    The second paragraph.
    ```

    - `title` is required. `date` is optional: `2023-09-01` or a full date and time (`2023-09-01T12:00:00Z`), the default is
      now. `image` is optional: a file from `article-images/`, a path, or the ID of an image that is already uploaded.
    - The blog shows the text as plain text, one paragraph per line. No Markdown, and no picture addresses in the text.

3. Check it, then publish it (the app container must be running, `docker compose up -d`):

    ```shell
    docker compose exec app npm run article:publish -- article-drafts/my-article.txt --dry-run
    docker compose exec app npm run article:publish -- article-drafts/my-article.txt
    ```

    This publishes to the API on your machine. If the article is refused (for example the date is in the future), the picture
    that was uploaded for it is removed again.

4. To publish to the server, give the address of the blog and the admin token of the server. The command only sends the token
   to `https` addresses (and to your own machine):

    ```shell
    read -rs BLOG_ADMIN_TOKEN && export BLOG_ADMIN_TOKEN
    docker compose exec -e BLOG_ADMIN_TOKEN app npm run article:publish -- article-drafts/my-article.txt --api https://blog.example.com
    ```

    `read -rs` asks for the token without showing it, so it does not end up in your shell history. `BLOG_API_URL` sets the
    default of `--api`. Without a local stack running, use this instead of `docker compose exec app`, it needs no database:

    ```shell
    docker compose run --rm --no-deps -e BLOG_ADMIN_TOKEN --entrypoint npm app run article:publish -- article-drafts/my-article.txt --api https://blog.example.com
    ```

The address of the blog is not stored in an article. Addresses of pictures are built from `PUBLIC_URL` whenever an article is
read, so moving the blog to a domain later does not touch the articles.

## Deployment

The blog runs on one small server (a VPS) with Docker Compose: Caddy gets the HTTPS certificate by itself and serves the front
end and the API from one address, the database keeps its data in a volume, and a script makes backups. It works with an IP
address now and with a domain later by changing one setting. The step-by-step guide is in
[docs/deployment.md](docs/deployment.md).

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
