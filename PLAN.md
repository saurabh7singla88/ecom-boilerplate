# ecom-app — Build Plan

A UI-driven e-commerce store for India (INR). Goals for v1: polished shopping UI, cart → checkout → order flow, online payments (Razorpay), a solid security layer, an admin dashboard, and pay-per-use deployment on AWS with ~$0 idle cost.

Architecture, layout and conventions: **[docs/architecture.md](./docs/architecture.md)**.

## Stack

| Layer           | Choice                                                                               |
| --------------- | ------------------------------------------------------------------------------------ |
| Monorepo        | pnpm workspaces: `apps/{api,storefront,admin}`, `packages/{db,shared,sdk}`           |
| Backend API     | Hono (TypeScript) on AWS Lambda (Function URL)                                       |
| Database        | PostgreSQL — Docker locally, Neon in the cloud — via Prisma 7 (`@prisma/adapter-pg`) |
| API client      | `@ecom/sdk` — Hono RPC typed client, no codegen                                      |
| Validation      | Zod schemas in `@ecom/shared`, shared by API and frontends                           |
| Storefront      | Next.js 16 (App Router), Tailwind 4 + shadcn/ui                                      |
| Admin           | Vite + React 19 + Tailwind 4, static build on S3                                     |
| Auth            | Better Auth in the API (customer + admin roles)                                      |
| Payments        | Razorpay, webhook as the source of truth                                             |
| Background jobs | SQS + subscriber Lambda (in-process locally)                                         |
| Email           | Resend + React Email                                                                 |
| Testing         | Vitest (API against Docker Postgres, UI units), Playwright (E2E)                     |
| Quality         | ESLint, Prettier, Husky + lint-staged, GitHub Actions                                |
| Infra           | SST v4 → CloudFront Router + Lambda + S3 + SQS, `ap-south-1`                         |

## Phases

### Phase 0 — Foundation (done)

- [x] Next.js scaffold, Tailwind + shadcn/ui, Prettier, ESLint, Husky + lint-staged
- [x] Prisma 7 + Docker Compose Postgres
- [x] Base storefront layout (header, footer, home, placeholder `/products`)
- [x] Vitest + Playwright smoke tests, GitHub Actions CI

### Phase 1 — API / storefront / admin split (current)

- [x] Architecture documented (`docs/architecture.md`)
- [x] pnpm workspace; storefront moved to `apps/storefront`; root `.gitignore` + `.gitattributes`; shared TS/ESLint/Prettier config
- [x] `packages/db`: Prisma schema moved here; catalog models (Category, Product, ProductVariant, ProductImage); first migration; seed data
- [x] `packages/shared`: product DTOs + query schemas, `formatPaise`
- [x] `apps/api`: Hono app, env, error handling, health route, event bus + SQS subscriber entry, products module (`/api/store/products`, `/api/store/products/:handle`, `/api/store/categories`), locked `/api/admin/*`
- [x] `packages/sdk`: typed client
- [x] Storefront reads the catalog through the SDK: `/products` (category filter, sort, pagination) and `/products/[handle]`; Prisma removed from the storefront
- [x] `apps/admin`: empty dashboard shell served under `/admin/`
- [x] `pnpm dev` runs API + storefront + admin with single-domain dev proxies
- [x] `sst.config.ts`: Router, Api function, Events queue + DLQ + subscriber, Storefront, Admin, `DatabaseUrl` secret
- [x] Tests: API service + routes (Vitest, real Postgres), storefront unit tests; CI runs every workspace with a Postgres service
- [ ] Playwright E2E run locally (specs written; needs `pnpm --filter @ecom/storefront exec playwright install chromium`)
- [x] README, CLAUDE.md updated
- [ ] First `sst deploy --stage dev` (needs `aws configure` + a Neon database)

### Phase 2 — Cart & checkout

- [ ] Models: Cart, CartItem, Address, Order, OrderItem (status: PENDING → PAID → FULFILLED | CANCELLED)
- [ ] `cart` module: guest cart by cookie, add/update/remove, merge on login
- [ ] Storefront: cart drawer (optimistic updates), checkout page (Indian address format, PIN code, state list)
- [ ] Order creation + stock reservation in one transaction
- [ ] Shipping: flat rate + free above ₹999

### Phase 3 — Auth & accounts

- [ ] Better Auth in `apps/api` (email/password + Google), sessions in Postgres, roles `CUSTOMER` / `ADMIN`
- [ ] `/api/admin/*` guarded by admin session; `/api/store/customers/me/*` by customer session
- [ ] Storefront: sign in/up, `/account`, order history
- [ ] Admin: login screen

### Phase 4 — Payments (Razorpay)

- [ ] `payments` module: create Razorpay order from our order, hosted checkout
- [ ] Webhook route: signature verification, idempotent handling, updates Order + Payment
- [ ] `order.paid` event → subscribers: confirmation email (Resend), stock decrement
- [ ] Cash on Delivery (optional)

### Phase 5 — Admin dashboard

- [ ] Products CRUD with image upload (S3 presigned URLs)
- [ ] Orders list/detail, status updates, refunds
- [ ] Categories, inventory

### Phase 6 — India tax & invoices

- [ ] GST: CGST+SGST (intra-state) vs IGST (inter-state), HSN-based rates per product
- [ ] GST invoice PDFs attached to order emails

### Phase 7 — Production hardening

- [ ] Custom domain on the Router (Route53 + ACM)
- [ ] Neon production branch; `prisma migrate deploy` as a deploy step
- [ ] Rate limiting (login, checkout, webhooks), security headers + CSP
- [ ] CloudWatch alarms; GitHub Actions deploy on `main`
- [ ] Later if needed: WAF, provisioned concurrency, CloudFront caching for product pages

## Region: India (INR)

- Currency INR, stored as integer paise; formatted with `en-IN`.
- GST implemented in-app (Stripe Tax and most SaaS tax engines don't cover India).
- Razorpay works for individuals and supports UPI, cards, net banking and wallets.
- Indian address format: PIN code, state list.

## Open questions

- Guest checkout, or account required?
- Product search: Postgres full-text to start; revisit if the catalog grows.
