# Architecture

ecom-app is a pnpm monorepo split the way Medusa splits a store: a **backend API** that owns all data and business logic, and **frontends** (storefront, admin) that only talk to that API. Everything deploys to AWS Lambda / S3 behind one CloudFront distribution, so the idle cost is close to $0.

## Layout

```
ecom-boilerplate/
  apps/
    api/            Backend — Hono on AWS Lambda. The only code that touches the database.
    storefront/     Customer-facing Next.js 16 site. Talks to the API via @ecom/sdk.
    admin/          Admin dashboard — Vite + React static app (S3). Talks to the API via @ecom/sdk.
  packages/
    db/             Prisma schema, migrations, seed and client. Used only by apps/api.
    shared/         Zod schemas + DTO types for API payloads, INR money helpers. Used everywhere.
    sdk/            Typed API client (Hono RPC). Used by storefront and admin.
  docs/             Architecture and decisions (this file).
  sst.config.ts     All AWS infrastructure.
  docker-compose.yml  Local Postgres.
```

Dependency direction (arrows mean "may import"):

```
storefront ─┐
            ├─► sdk ─► (types of) api
admin ──────┘
storefront, admin, sdk, api ─► shared
api ─► db
```

`db` is never imported by a frontend. `api` is never imported at runtime by a frontend (the SDK only imports its **types**).

## Request flow in production

```
                        ┌──────────── CloudFront (Router) ─────────────┐
Browser ── example.com ─┤  /api/*    ─► Lambda: apps/api (Function URL) ├─► Neon Postgres
                        │  /admin/*  ─► S3: apps/admin (static build)   │
                        │  /*        ─► Lambda + S3: apps/storefront    │   (OpenNext)
                        └──────────────────────────────────────────────┘
apps/api ── emits events ─► SQS "Events" ─► Lambda: apps/api subscribers (emails, stock, …)
```

- **One domain.** Frontends call the API at the same origin (`/api/...`), so there is no CORS and auth cookies are shared.
- The storefront's server components call the API over HTTP (`API_URL`), exactly like a browser would. There is no private back door into the database.

## Local development

| Process    | URL                          | Command (all started by `pnpm dev`)      |
| ---------- | ---------------------------- | ---------------------------------------- |
| API        | http://localhost:9000/api    | `tsx watch` on `apps/api/src/server.ts`  |
| Storefront | http://localhost:8000        | `next dev` (proxies `/api/*` to the API) |
| Admin      | http://localhost:5173/admin/ | `vite` (proxies `/api/*` to the API)     |
| Postgres   | localhost:5432 (Docker)      | `pnpm db:up`                             |

The dev proxies reproduce the single-domain setup, so code never has to know whether it runs locally or on AWS. Events are dispatched in-process locally (no SQS needed).

If a port is taken on your machine, change it locally: `API_PORT` in `.env`, and for Postgres a git-ignored `docker-compose.override.yml` (remember to update `DATABASE_URL`).

Local configuration:

- Root `.env` — backend config (`DATABASE_URL`, `API_PORT`). Read by `apps/api` and `packages/db`.
- `apps/storefront/.env.local` — `API_URL`.
- `apps/admin` needs no env for local dev.

Each has a committed `.example` file.

## Backend (apps/api)

```
apps/api/src/
  app.ts            Builds the Hono app: middleware, error handler, mounts routers. Exports `AppType`.
  env.ts            Zod-validated environment. The only place that reads process.env.
  lambda.ts         AWS Lambda entry (hono/aws-lambda).
  server.ts         Local Node entry (@hono/node-server).
  lib/              Cross-cutting helpers: errors, validation, db handle, admin guard, event bus.
  modules/          One folder per business domain.
    products/
      service.ts    Business logic + Prisma queries. Returns DTOs, never raw Prisma rows.
      store.routes.ts   Public routes (/api/store/...).
      admin.routes.ts   Admin routes (/api/admin/...), when the module has any.
      service.test.ts
  subscribers/
    index.ts        Event name → handlers registry, and `dispatch`.
    lambda.ts       SQS entry point (partial batch failures → only failed messages retry).
test/               Test DB setup (separate `<db>_test` database, migrated automatically) and fixtures.
```

New modules (`cart`, `orders`, `customers`, `payments`, `auth`) are added as folders under `modules/` in the phase that needs them — see PLAN.md. There are no empty placeholder folders.

### API surface

Like Medusa, the API has two audiences:

| Prefix         | Audience               | Auth                                  |
| -------------- | ---------------------- | ------------------------------------- |
| `/api/store/*` | Storefront (customers) | Public; customer session where needed |
| `/api/admin/*` | Admin dashboard        | Admin session required on every route |
| `/api/health`  | Monitoring             | Public                                |

Until auth lands (Phase 3), `/api/admin/*` rejects every request, so nothing admin-only is ever exposed by accident.

### Conventions

- **Routes are thin.** They validate input with Zod (from `@ecom/shared`), call a service, and return JSON. No Prisma in route files.
- **Services own the logic** and map database rows to DTOs defined in `@ecom/shared`. The DB shape can change without breaking clients.
- **Errors** are thrown as `HttpError` (`notFound()`, `badRequest()`, …) and turned into `{ error: { code, message } }` by one error handler.
- **Money** is integer paise everywhere (`pricePaise`). Formatting happens only in frontends via `formatPaise` from `@ecom/shared`.
- **Side effects that can be slow or retried** (emails, stock sync, webhooks fan-out) are emitted as events and handled in `subscribers/`, not in the request path.
- **Lambda-friendly:** no in-memory state that must survive between requests, no filesystem writes, small imports. The Prisma client is created once per warm container.

### Adding a new module

1. Add models to `packages/db/prisma/schema.prisma`, then `pnpm db:migrate`.
2. Add request/response schemas and DTO types to `packages/shared/src/<module>.ts`.
3. Create `apps/api/src/modules/<module>/service.ts` (+ `service.test.ts`).
4. Create `store.routes.ts` and/or `admin.routes.ts` and mount them in `apps/api/src/app.ts`.
5. The SDK picks up the new routes automatically (Hono RPC types). Use them from the storefront/admin via `api.store.<module>...`.

## Storefront (apps/storefront)

- Next.js 16 App Router, Server Components by default, Tailwind 4 + shadcn/ui.
- Data comes only from `@ecom/sdk`, called from server components or server actions in `src/features/<domain>/`.
- URL search params drive filter/sort/page state on catalog pages.
- No database, no Prisma, no secrets other than what's needed to reach the API.

## Admin (apps/admin)

- Vite + React 19 + Tailwind 4, built to static files and served from S3 under `/admin/`.
- Uses `@ecom/sdk` against `/api/admin/*`. Currently a shell (layout + API status); screens are added per module.

## Infrastructure and cost (sst.config.ts)

| Resource      | What                                                  | Cost at low traffic                  |
| ------------- | ----------------------------------------------------- | ------------------------------------ |
| `Router`      | CloudFront distribution, routes `/api`, `/admin`, `/` | Free tier: 1 TB + 10M requests/month |
| `Api`         | Lambda with a Function URL (no API Gateway)           | Free tier: 1M requests/month         |
| `Events`      | SQS queue + subscriber Lambda                         | Free tier: 1M requests/month         |
| `Storefront`  | Next.js via OpenNext (Lambda + S3)                    | Within free tier                     |
| `Admin`       | Static site on S3                                     | Cents                                |
| `DatabaseUrl` | SST secret (SSM Parameter Store, standard tier)       | Free                                 |
| Neon Postgres | Serverless Postgres, scales to zero                   | Free tier                            |

Deliberately avoided because they cost money even when idle: NAT Gateway (~$32/month — Lambdas stay out of a VPC and reach Neon over TLS), RDS, API Gateway, Secrets Manager, provisioned concurrency, Redis. CloudWatch log retention is capped at 2 weeks. The only fixed cost appears when a custom domain is added (Route53 hosted zone, ~$0.50/month).

## Decisions

| Decision        | Choice                                             | Why                                                                                                          |
| --------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| API framework   | Hono                                               | Tiny, fast cold starts, same code on Lambda and Node, typed RPC client without codegen.                      |
| Topology        | Single domain via CloudFront Router                | No CORS, shared cookies, one certificate.                                                                    |
| Database        | Postgres (Neon) + Prisma 7                         | Relational queries a store needs; Prisma 7 has no native engine, so Lambda bundles stay small.               |
| Auth (Phase 3)  | Better Auth inside the API                         | Free, framework-agnostic, sessions in Postgres. Replaces the earlier Auth.js plan, which is tied to Next.js. |
| Admin           | Separate static SPA                                | $0 hosting, clean separation from the customer site.                                                         |
| Background work | SQS + subscriber Lambda; in-process locally        | Medusa-style subscribers, free tier, retries built in.                                                       |
| Payments        | Razorpay (Phase 4), webhook is the source of truth | Supports individuals, UPI/cards/netbanking.                                                                  |
