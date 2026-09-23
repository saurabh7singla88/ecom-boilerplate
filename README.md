# ecom-app

UI-driven e-commerce storefront for India (INR), built with Next.js 16, Prisma 7 on Postgres (Neon), and deployed serverlessly to AWS Lambda via SST.

See [PLAN.md](./PLAN.md) for the roadmap and architecture, and [CLAUDE.md](./CLAUDE.md) for conventions.

## Prerequisites

- Node 22+, pnpm 10+
- Docker (for local Postgres)
- AWS CLI configured (only for deploys)

## Local development

```bash
pnpm install
cp .env.example .env.local        # then edit if needed
pnpm db:up                        # start Postgres in Docker
pnpm db:migrate                   # apply migrations (first run creates the schema)
pnpm db:generate                  # generate the Prisma client
pnpm dev                          # http://localhost:3000
```

## Scripts

| Script                                                 | What it does                                             |
| ------------------------------------------------------ | -------------------------------------------------------- |
| `pnpm dev` / `pnpm build` / `pnpm start`               | Next.js dev server / production build / serve build      |
| `pnpm lint` / `pnpm typecheck` / `pnpm format`         | ESLint / `next typegen` + `tsc` / Prettier               |
| `pnpm test` / `pnpm test:watch`                        | Vitest unit tests                                        |
| `pnpm test:e2e`                                        | Playwright end-to-end tests (starts the dev server)      |
| `pnpm db:up` / `pnpm db:down`                          | Start / stop local Postgres                              |
| `pnpm db:migrate` / `pnpm db:deploy`                   | Create & apply dev migrations / apply migrations in prod |
| `pnpm db:generate` / `pnpm db:studio` / `pnpm db:seed` | Prisma client / Prisma Studio / seed data                |
| `pnpm deploy`                                          | `sst deploy --stage production`                          |

Pre-commit runs `lint-staged` (ESLint + Prettier on staged files).

## Deployment

Infra is defined in `sst.config.ts` (AWS `ap-south-1`). Set the database secret once per stage, then deploy:

```bash
pnpm sst secret set DatabaseUrl "postgresql://..." --stage production
pnpm deploy
```
