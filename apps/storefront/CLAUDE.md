@AGENTS.md

# Storefront (Next.js 16)

Customer-facing site. Repo-wide rules are in the root `CLAUDE.md`; this file covers the storefront.

## Conventions

- Server Components by default; add `"use client"` only for state, effects or browser APIs.
- Data comes only from the API: server-only query functions in `src/features/<domain>/queries.ts` using the client from `src/lib/api.ts`. Mutations (from Phase 2) are Server Actions in `src/features/<domain>/actions.ts` that call the API.
- Feature code lives in `src/features/<domain>/` (components, queries, actions). Shared UI primitives (shadcn) in `src/components/ui/`.
- URL search params drive list/filter/sort/page state (`features/catalog/search-params.ts`), so views are shareable.
- Env only through `src/lib/env.ts`.

## Next.js 16 notes (differs from 13–15; full docs in `node_modules/next/dist/docs/`)

- `params` and `searchParams` are Promises — always `await` them. Use the global `PageProps<"/route">`, `LayoutProps<"/route">`, `RouteContext<"/route">` types (no import needed).
- `typedRoutes` is on: `<Link href>` must point at an existing route or typecheck fails. Prefer `{ pathname, query }` objects for links with query strings.
- Request-level middleware lives in `src/proxy.ts` exporting `proxy` (not `middleware.ts`); Node runtime only.
- `next/image`: use `preload` (not the deprecated `priority`); remote hosts go in `images.remotePatterns`.
- `revalidateTag(tag, "max")` needs the second argument; `cacheLife`/`cacheTag` come from `next/cache`. `cacheComponents` / `"use cache"` are not enabled yet — catalog queries call `connection()` so they run per request (caching revisited in Phase 7).
- Turbopack is the default for dev and build; route types come from `next typegen` (run by `pnpm typecheck`).
- Every parallel-route slot needs an explicit `default.tsx`.
- Workspace packages (`@ecom/sdk`, `@ecom/shared`) are TypeScript source; they're listed in `transpilePackages`.
