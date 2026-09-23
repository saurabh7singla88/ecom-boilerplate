@AGENTS.md

# ecom-app

UI-driven e-commerce storefront for India (INR). See `PLAN.md` for the full roadmap, architecture, and phase checklist — keep it updated as phases complete.

## Stack

- Next.js 16 (App Router) with TypeScript strict mode, React 19
- Tailwind CSS 4 + shadcn/ui; Framer Motion for animation
- PostgreSQL on Neon via Prisma 7 (`@prisma/adapter-pg`; Neon pooled connection string in Lambda). Generated client lives in `src/generated/prisma` (gitignored — run `pnpm db:generate`)
- Auth.js v5 (credentials + Google), roles `CUSTOMER` / `ADMIN`
- Payment gateway (Stripe or Razorpay, decided in Phase 3) behind `src/server/payments`
- Zustand for client state (cart/UI); Zod + React Hook Form for forms
- Vitest + Testing Library for unit tests, Playwright for E2E
- SST v3 (OpenNext) deploying to AWS Lambda + CloudFront + S3
- Package manager: pnpm

## Commands

- `pnpm dev` — dev server
- `pnpm build` / `pnpm start`
- `pnpm lint`, `pnpm typecheck`, `pnpm format`
- `pnpm test` (Vitest), `pnpm test:e2e` (Playwright)
- `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:studio`

## Conventions

- Server Components by default; add `"use client"` only when the component needs state, effects, or browser APIs.
- Mutations go through Server Actions in `src/features/<domain>/actions.ts`. Every action validates input with Zod and checks auth/role itself — never trust the client.
- Feature modules live in `src/features/<domain>/` (components, actions, schemas, queries). Shared UI primitives in `src/components/ui/`. Infra clients (Prisma, payments, Auth) in `src/server/`.
- All database access goes through `src/server/db/` so the datastore can be swapped without touching features.
- Environment variables are read only through the Zod-validated `src/lib/env.ts`, never `process.env` directly.
- URL search params drive list/filter/sort state on catalog pages so views are shareable and RSC-cacheable.
- Payment status is set only by the gateway webhook handler, never by the success redirect.
- Money is stored as integer paise (INR minor units), never floats. Format with `en-IN` locale.
- Secrets never go in the repo; local values in `.env.local`, production via AWS Secrets Manager.

## Next.js 16 notes (differs from 13–15; full docs in `node_modules/next/dist/docs/`)

- `params` and `searchParams` are Promises — always `await` them. Use the global `PageProps<"/route">`, `LayoutProps<"/route">`, `RouteContext<"/route">` helper types (no import needed).
- `typedRoutes` is on: `<Link href>` must point at an existing route or typecheck fails.
- Request-level middleware lives in `src/proxy.ts` exporting `proxy` (not `middleware.ts`); it runs on the Node runtime only.
- `next/image`: use `preload` (not the deprecated `priority`); remote hosts go in `images.remotePatterns`.
- `revalidateTag(tag, "max")` requires the second argument; `cacheLife`/`cacheTag` are stable imports from `next/cache`. `cacheComponents` / `"use cache"` are not enabled yet — decide in Phase 1.
- Turbopack is the default for dev and build; `next dev` writes to `.next/dev`. Route types come from `next typegen` (run by `pnpm typecheck`).
- Every parallel-route slot needs an explicit `default.tsx`.

## Serverless constraints

- Code runs on Lambda: no long-lived in-memory state, no filesystem persistence, keep cold-start size small (avoid heavy top-level imports in server code).
- Long-running or retryable work (emails, stock sync) goes to the SQS worker, not the request path.
