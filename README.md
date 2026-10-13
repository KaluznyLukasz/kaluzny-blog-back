# Nest.js project boilerplate nestjs-project-boilerplate

## Repository contents

Repository contains boilerplate project using Nest.js.

Project is using Node.js and TypeScript in versions listed below:

| Technology | Version |
| ---------- | ------- |
| Node.js    | 24.10   |
| TypeScript | 5.8     |

Main dependencies are Nest.js and Prisma ORM in versions listed below.

| Vendor  | Version |
| ------- | ------- |
| Nest.js | ^11.1   |
| Prisma  | ^6.7.0  |

## Infrastructure

We use the following services:

- AWS EC2 instance with Dokku, with:
    - app container (docker container locally)
    - PostgreSQL database (PostgreSQL container locally)

Locally, they are set up using `docker compose`.

### Setting project up

This app uses docker-based virtualization to run. In order to set up project, follow these steps:

1. Clone project by running:
    ```shell
    git clone git@github.com:oskarbarcz/nestjs-project-boilerplate.git
    ```
2. Prepare environment variable file by copying .env.dist to .env and fill it with your data.
    ```shell
    cd nestjs-project-boilerplate
    cp .env.dist .env
    ```
3. Use `docker compose` to set up the environment

    ```shell
    docker compose up -d --build
    ```

    Packages, database schema, seed data will be configured automatically.

4. Your project should be up and running. Open browser and go to http://localhost/api to see the api documentation.
   You can preview app logs by running:
    ```shell
    docker compose logs -f app
    ```

### Running the project tips

> **Do not execute NPM or any other commands regarding project from your host machine, use container shell instead.**
> For example, to generate Prisma schema run:
>
> ```shell
> docker compose exec app npm run lint
> ```
>
> It will execute the `npm run lint` command in the container shell.

To shut down the containers run:

```shell
docker compose down
```

## Testing

To run tests, execute the following commands:

```bash
# unit tests
$ docker compose exec app npm run test

# functional tests
$ docker compose exec app npm run test:functional
```

We use **Jest** for unit tests, and **cucumber-js** for functional tests. Unit tests are stored in the `src` directory
just near the tested module, while functional tests are stored in the `features` directory.

## Release & deploy

> Before merging Pull Request to the main branch, make sure to bump the project version in the `package.json` file,
> line `3`. Then it's a good practice to run `npm install` inside a docker container to update the `package-lock.json`
> file.
>
> Not bumping the version will result in the release failure. There is a step in CI that will protect the main branch
> from being merged without bumping the version.
