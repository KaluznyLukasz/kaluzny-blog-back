# Deployment on a VPS

The whole blog runs on one small server with Docker Compose (`compose.prod.yaml`):

```
Internet ──HTTPS──▶ Caddy ──┬─ /api, /api-json ──▶ app (Nest.js) ──▶ database (Postgres, volume)
                            └─ everything else ──▶ the built front end (./site)
```

- **Caddy** gets and renews the HTTPS certificate by itself. It is the only container reachable from the internet.
- **One address** serves the front end and the API. The front end is built without an API address, so it calls the address it
  was loaded from. That is why moving to a domain later needs no rebuild of the front end.
- **The database** keeps its data in the Docker volume `database-data`. Images are stored in the database too, so one backup
  covers articles and pictures.
- Production runs the migrations when the app starts and never loads the seed data, so only your articles are there.

## What you need

- A VPS with Ubuntu 24.04 (or another Linux) and SSH access. A small one is enough for a blog.
- Its public IP address. For now you do not need a domain.

## 1. Prepare the server

Log in over SSH and:

1. Install Docker Engine with the Compose plugin, following the official guide for your system:
   https://docs.docker.com/engine/install/ubuntu/. Add your user to the `docker` group so you do not need `sudo` for it.
2. Open only the ports that are needed (the examples use `ufw`):

    ```shell
    sudo ufw allow OpenSSH
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw allow 443/udp
    sudo ufw enable
    ```

    Do not publish the database port. `compose.prod.yaml` does not, and Docker ignores `ufw` for ports that a container
    publishes.

3. Use SSH keys and turn password login off, and install security updates regularly (`sudo apt update && sudo apt upgrade`).

## 2. Get the code and the settings

```shell
git clone https://github.com/KaluznyLukasz/kaluzny-blog-back.git
cd kaluzny-blog-back
cp .env.production.dist .env.production
chmod 600 .env.production
```

Fill in `.env.production`:

- `SITE_ADDRESS`: the address of the blog without `https://`. While you have no domain, use a name that points at the IP of
  the server: for `203.0.113.10` it is `203-0-113-10.sslip.io`. [sslip.io](https://sslip.io) is a free public service that
  answers with the IP written in the name, which is enough for Caddy to get a real certificate. It is a third party, so use a
  domain for anything long term.
- `POSTGRES_PASSWORD`: `openssl rand -hex 24`
- `ADMIN_TOKEN`: `openssl rand -hex 32`. Keep it in a password manager. It lets you create, change and delete articles and
  images, so never commit it, never paste it into a chat and only use it over `https`.

`.env.production` is git-ignored. Compose refuses to start while one of the three values is empty.

## 3. Build and upload the front end

On your machine, in the front end repository. The empty `VITE_API_URL` makes the front end call the address it is served
from (a plain `yarn build` would use the address in your `.env`, which is the local API):

```shell
VITE_API_URL= yarn build
rsync -av --delete build/client/ <user>@<server>:kaluzny-blog-back/site/
```

Do this again after every change of the front end. Caddy serves the new files at once.

## 4. Start it

On the server, in `kaluzny-blog-back`:

```shell
docker compose -f compose.prod.yaml --env-file .env.production up -d --build --wait
```

The first start builds the image and gets the certificate, which takes a few minutes. Then open
`https://<SITE_ADDRESS>/` (the blog) and `https://<SITE_ADDRESS>/api` (the API documentation).

If there is no certificate, read `docker compose -f compose.prod.yaml --env-file .env.production logs caddy`. The usual
causes are a closed port 80 or 443, or a name that does not point at the server yet.

To save typing, put `export COMPOSE_FILE=compose.prod.yaml COMPOSE_ENV_FILES=.env.production` in your shell profile on the
server, then `docker compose up -d --build --wait`, `docker compose logs app` and so on work as usual.

## 5. Publish articles

On your machine, in this repository (not on the server), with the new article in `article-drafts/` and its picture in
`article-images/`, see [Publishing an article](../README.md#publishing-an-article). The command needs no local stack:

```shell
read -rs BLOG_ADMIN_TOKEN && export BLOG_ADMIN_TOKEN
docker compose run --rm --no-deps -e BLOG_ADMIN_TOKEN --entrypoint npm app run article:publish -- article-drafts/my-article.txt --api https://<SITE_ADDRESS>
```

A `date:` line in the draft sets the date of the article, so older articles (a story from 2023) get their real date. The
production database starts empty, so publish the articles you already have locally the same way.

## 6. Backups

`docker/prod/backup` writes a dump of the database (articles and pictures) to `backups/` and keeps the 14 newest. Run it
every night from cron on the server (`crontab -e`):

```
0 3 * * * /home/<user>/kaluzny-blog-back/docker/prod/backup >> /home/<user>/backup.log 2>&1
```

A backup on the same server does not survive losing the server, so copy `backups/` somewhere else now and then (`rsync` or
`scp` to your own machine, or `rclone` to a cloud drive). An untested backup is a hope, not a backup: restore one once on
purpose.

**Restore** (this replaces everything in the database with the dump):

```shell
docker compose -f compose.prod.yaml --env-file .env.production stop app
docker compose -f compose.prod.yaml --env-file .env.production exec -T database psql -U blog -d postgres -c "DROP DATABASE blog" -c "CREATE DATABASE blog"
gunzip -c backups/blog-<date>.sql.gz | docker compose -f compose.prod.yaml --env-file .env.production exec -T database psql -U blog -d blog -v ON_ERROR_STOP=1 -q
docker compose -f compose.prod.yaml --env-file .env.production start app
```

## Updating

```shell
git pull
docker compose -f compose.prod.yaml --env-file .env.production up -d --build --wait
```

The app applies new migrations when it starts. The front end is uploaded separately (step 3).

## Moving to a domain

1. Buy a domain and add an `A` record (and an `AAAA` record if the server has an IPv6 address) that points at the server.
2. Wait until it resolves (`dig +short blog.example.com`).
3. In `.env.production` set `SITE_ADDRESS=blog.example.com`.
4. `docker compose -f compose.prod.yaml --env-file .env.production up -d`. Caddy gets a certificate for the new name, and the
   API starts to hand out addresses that begin with it.
5. Publish with `--api https://blog.example.com` from now on.

Nothing else changes. The articles and the pictures stay as they are, because the address of a picture is built from the
setting when the article is read, and the front end uses the address it is loaded from. The old `sslip.io` address stops
working.

## Good to know

- `docker compose down` keeps your data (the volume stays). **`docker compose down -v` deletes the database**, and with it
  every article and picture. Only the backup brings them back.
- Never use `http://` for the API on a server: the admin token would travel unprotected. The publish command refuses to.
- The API documentation at `/api` is public. It only describes the API, writing still needs the admin token.
- A change in `docker/prod/caddy/Caddyfile` is applied with `docker compose ... restart caddy`.
- Without `CORS_ORIGIN`, no other site may call the API from a browser. That is right while the front end is served from the
  same address. Set it only if you publish the front end on another address.
