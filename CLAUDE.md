# ecom-app

E-commerce store for India (INR), split Medusa-style into a backend API and frontends. **Read [docs/architecture.md](./docs/architecture.md) before structural changes**; keep it and [PLAN.md](./PLAN.md) (phase checklist) up to date.

## Layout

- `apps/api` — Hono API on Lambda. The **only** code that touches the database.
- `apps/storefront` — Next.js 16 customer site (see `apps/storefront/CLAUDE.md` for Next.js 16 specifics).
- `apps/admin` — Vite + React admin, static build served under `/admin/`.
- `packages/db` — Prisma 7 schema, migrations, seed, `createDb()`. Generated client in `packages/db/src/generated` (gitignored; `pnpm db:generate`, also runs on install).
- `packages/shared` — Zod schemas, DTO types, `formatPaise`. Shared by every app.
- `packages/sdk` — typed Hono RPC client (`createApiClient`, `unwrap`, `ApiError`).

## Commands (repo root)

- `pnpm dev` — API :9000, storefront :8000, admin :5173 (needs `pnpm db:up`)
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm format`
- `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:studio`
- Filter one workspace: `pnpm --filter @ecom/api <script>`

## Rules

- **Frontends never import `@ecom/db`** or reach the database. They call the API through `@ecom/sdk`. The SDK imports only the API's _types_ (`AppType`).
- **API routes are thin**: validate with `validate(target, schema)` (schemas from `@ecom/shared`), call a module service, return `c.json(...)`. Keep route chains unbroken (`new Hono().get(...).get(...)`) so RPC types flow to the SDK.
- **Services** (`modules/<name>/service.ts`) own business logic and Prisma queries, and return DTOs from `@ecom/shared` — never raw Prisma rows. Build them as `createXService(db)` so tests can pass the test DB.
- **Errors**: throw `notFound()` / `badRequest()` / `HttpError` from `apps/api/src/lib/errors.ts`; the app's error handler returns `{ error: { code, message } }`.
- `/api/admin/*` is behind `requireAdmin`. Never add an admin route outside that router.
- Slow or retryable side effects go through `emit()` (`lib/events.ts`) + a handler in `subscribers/`. Handlers must be idempotent (SQS is at-least-once).
- Env vars are read only through each app's Zod-validated `env.ts`.
- Money is integer paise (`*Paise` fields); format only in UI via `formatPaise`. Prices are GST-inclusive.
- Payment status is set only by the gateway webhook handler, never by a redirect (Phase 4).
- Secrets never go in the repo: local values in `.env` / `.env.local` (git-ignored), cloud via `sst secret set`.

## Serverless constraints

- Everything runs on Lambda: no in-memory state that must survive between requests, no filesystem writes, keep imports small (lazy-import heavy SDKs, like `lib/events.ts` does).
- No VPC, NAT Gateway, RDS, API Gateway or other always-on resources — they break the ~$0 idle cost. Discuss before adding anything with an hourly price.

## Testing

- API tests hit a real Postgres test database (`<db>_test`, created and migrated by `apps/api/test/global-setup.ts`). Use `resetDatabase` + fixtures from `apps/api/test/fixtures.ts`.
- New service logic gets a `service.test.ts`; new routes get coverage in `app.test.ts` or a module route test.
