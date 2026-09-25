# ecom-app

E-commerce store for India (INR). A pnpm monorepo with a **Hono API** that owns all data, a **Next.js storefront** and a **React admin**, all deployed to AWS Lambda / S3 behind one CloudFront domain for close to $0 at idle.

- Architecture, conventions, how to add a module: [docs/architecture.md](./docs/architecture.md)
- Roadmap: [PLAN.md](./PLAN.md)

```
apps/api          Backend API (Hono → Lambda)       http://localhost:9000/api
apps/storefront   Customer site (Next.js 16)        http://localhost:8000
apps/admin        Admin dashboard (Vite + React)    http://localhost:5173/admin/
packages/db       Prisma schema, migrations, seed
packages/shared   Zod schemas, DTO types, INR helpers
packages/sdk      Typed API client (Hono RPC)
```

## Prerequisites

- Node 22.12+ and pnpm 10 (`corepack enable` installs the pinned pnpm)
- Docker (local Postgres)
- AWS CLI credentials — only for deploying

## Local development

```bash
pnpm install                                         # also generates the Prisma client
cp .env.example .env                                 # backend config
cp apps/storefront/.env.example apps/storefront/.env.local
pnpm db:up                                           # Postgres in Docker
pnpm db:migrate                                      # apply migrations
pnpm db:seed                                         # sample catalog
pnpm dev                                             # API + storefront + admin
```

## Scripts (run from the repo root)

| Script                                                 | What it does                                                            |
| ------------------------------------------------------ | ----------------------------------------------------------------------- |
| `pnpm dev`                                             | All apps in parallel (`dev:api`, `dev:storefront`, `dev:admin` for one) |
| `pnpm build`                                           | Production builds (storefront, admin)                                   |
| `pnpm lint` / `pnpm typecheck` / `pnpm format`         | ESLint / TypeScript in every workspace / Prettier                       |
| `pnpm test`                                            | Vitest in every workspace (API tests use a separate `_test` database)   |
| `pnpm test:e2e`                                        | Playwright (starts API + storefront; needs a seeded database)           |
| `pnpm db:up` / `pnpm db:down`                          | Start / stop local Postgres                                             |
| `pnpm db:migrate` / `pnpm db:deploy`                   | Create + apply dev migrations / apply migrations (CI, prod)             |
| `pnpm db:generate` / `pnpm db:seed` / `pnpm db:studio` | Prisma client / sample data / Prisma Studio                             |
| `pnpm deploy`                                          | `sst deploy --stage production`                                         |

Pre-commit runs `lint-staged` (ESLint + Prettier on staged files).

## Deployment

Infra lives in `sst.config.ts` (AWS `ap-south-1`): a CloudFront Router in front of the API Lambda (`/api`), the admin static site (`/admin`) and the storefront (`/`), plus an SQS queue for background events.

```bash
pnpm sst secret set DatabaseUrl "postgresql://...neon.tech/ecom?sslmode=require" --stage dev
pnpm db:deploy          # with DATABASE_URL pointing at the same database
pnpm sst deploy --stage dev
```
