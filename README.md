# Recipe Manager

Full-stack recipe manager. Monorepo with three workspaces:

| Workspace | Path | Stack |
|-----------|------|-------|
| API | `apps/api` | NestJS + Prisma + PostgreSQL |
| Web | `apps/web` | Next.js (SPA) + Tailwind + TanStack Query |
| Shared types | `packages/shared` | TypeScript — source of truth for the API boundary |

The only runtime dependency you run yourself is **PostgreSQL**, provided by the
root `docker-compose.yml`. Everything else runs directly on Node.

---

## Prerequisites

- **Node.js** (v22 recommended) and **npm** — assumed already installed.
- **Docker** + **Docker Compose** — runs PostgreSQL.
- **Yarn 4** — this repo pins `yarn@4.9.1` via the `packageManager` field. Enable
  it through Corepack (ships with Node):

  ```bash
  corepack enable
  ```

  After this, the `yarn` command in the repo resolves to the pinned version
  automatically. (If you prefer not to use Corepack: `npm install -g yarn` then
  `yarn set version 4.9.1`.)

---

## 1. Configure environment files

Each app owns its own `.env`. Copy the templates and adjust as needed:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp .env.example .env            # only needed for the staging compose file
```

The defaults work out of the box for local development. Notes:

- **`apps/api/.env`** holds both the app's `DATABASE_URL` **and** the
  `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` variables that the
  Postgres container in `docker-compose.yml` reads on first boot. These must
  stay consistent with each other (the defaults already match).
- For real use, replace `SESSION_SECRET` and `ADMIN_SESSION_SECRET` with long
  random strings.
- The Umami analytics variables are optional and can be left blank.
- `apps/web/.env` only needs `INTERNAL_API_URL` for proxying; it defaults to
  `http://localhost:3001` when unset, so it can stay blank locally.

---

## 2. Install dependencies

From the repo root (installs all workspaces):

```bash
yarn install
```

---

## 3. Start PostgreSQL

```bash
docker compose up -d db
```

This starts Postgres on `localhost:5432` with the credentials from
`apps/api/.env`. Data persists in the `postgres_data` Docker volume.

> First boot creates the database and user from `POSTGRES_*`. If you change those
> values later, you must reset the volume for them to take effect:
> `docker compose down -v && docker compose up -d db`.

---

## 4. Build shared types

The API and web apps import `@recipe-manager/shared`, so build it first:

```bash
yarn workspace @recipe-manager/shared build
```

---

## 5. Apply database migrations

This applies all Prisma migrations to the empty database **and** generates the
Prisma client:

```bash
yarn workspace @recipe-manager/api migrate:dev
```

Verify with:

```bash
yarn workspace @recipe-manager/api prisma migrate status
```

---

## 6. Seed the database

Run the seeds **in this order** — the dev seed depends on the reference data
created by the first one:

```bash
# 1. Reference data: units + foods (required baseline)
yarn workspace @recipe-manager/api seed:data

# 2. Dev data: a test household, users, and sample recipes
yarn workspace @recipe-manager/api seed:dev
```

Both seeds are idempotent (safe to re-run). The dev seed creates these login
accounts:

| Role | Email | Password |
|------|-------|----------|
| User | `test@example.com` | `password123` |
| Admin | `admin@example.com` | `admin123` |

### Agent / automation access

The dev seed also creates an **agent (bot) member** in the test household with a
**deterministic** id and API key, so a test-automation harness can know these
values up front (hard-code the same ones in your automation env):

| Value | Default |
|-------|---------|
| Household id | `dev-household-id` |
| Agent (bot) user id | `dev-agent-user-id` |
| API token | `dev-agent-api-token-do-not-use-in-production` |

Agent requests authenticate with the token as a Bearer header — they hit the
same endpoints as the UI (no admin access):

```bash
curl -H "Authorization: Bearer dev-agent-api-token-do-not-use-in-production" \
  http://localhost:3001/api/household
```

To use your own token value, set `DEV_AGENT_API_TOKEN` in `apps/api/.env` before
running `seed:dev` (re-running the seed updates the stored token).

---

## 7. Run the apps

Open two terminals.

**API** (NestJS, hot reload):

```bash
yarn workspace @recipe-manager/api start:dev
```

- API base URL: <http://localhost:3001/api>
- Swagger / OpenAPI docs: <http://localhost:3001/api/docs>

**Web** (Next.js):

```bash
yarn workspace @recipe-manager/web dev
```

- App: <http://localhost:3000>

The web app proxies `/api/*` to the API (`INTERNAL_API_URL`, default
`http://localhost:3001`), so start the API before logging in.

---

## Quick reference

```bash
# One-time setup
corepack enable
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
yarn install

# Bring up the stack from a fresh, empty database
docker compose up -d db
yarn workspace @recipe-manager/shared build
yarn workspace @recipe-manager/api migrate:dev
yarn workspace @recipe-manager/api seed:data
yarn workspace @recipe-manager/api seed:dev

# Run (separate terminals)
yarn workspace @recipe-manager/api start:dev   # http://localhost:3001/api
yarn workspace @recipe-manager/web dev         # http://localhost:3000
```

---

## Ports

| Service | URL |
|---------|-----|
| Web (Next.js) | <http://localhost:3000> |
| API (NestJS) | <http://localhost:3001/api> |
| API docs (Swagger) | <http://localhost:3001/api/docs> |
| PostgreSQL | `localhost:5432` |

---

## Tests

```bash
yarn workspace @recipe-manager/api test               # API unit tests
yarn workspace @recipe-manager/api test:integration   # API integration tests
yarn workspace @recipe-manager/api test:e2e           # API e2e tests
yarn workspace @recipe-manager/web test               # Web tests (Vitest)
```

For the full list of runnable scripts across all workspaces, see
[`.claude/commands-reference.md`](.claude/commands-reference.md).

---

## Troubleshooting

- **`yarn` not found / wrong version** — run `corepack enable`, then retry from
  the repo root.
- **API can't connect to the database** — confirm the container is up
  (`docker compose ps`) and that `DATABASE_URL` in `apps/api/.env` matches the
  `POSTGRES_*` values in the same file.
- **`seed:dev` fails with missing units/foods** — run `seed:data` first.
- **Type errors importing `@recipe-manager/shared`** — rebuild it:
  `yarn workspace @recipe-manager/shared build`.
- **Stale Prisma client after a schema change** — run
  `yarn workspace @recipe-manager/api prisma generate`.
