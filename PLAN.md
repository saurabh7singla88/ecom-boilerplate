# ecom-app — Build Plan

A UI-driven e-commerce storefront for India (INR). Goals for v1: polished shopping UI, basic order and purchase flow, online payments, a solid security layer, and pay-per-use deployment on AWS.

## Stack

| Layer            | Choice                                                                                | Notes                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Framework        | Next.js 16 (App Router), TypeScript strict, `typedRoutes`                             | RSC for product pages, Server Actions for mutations; Turbopack default                            |
| UI               | Tailwind CSS + shadcn/ui, Framer Motion                                               | Fully customizable, fast to build                                                                 |
| Client state     | Zustand (cart/UI), TanStack Query where client fetching is needed                     | RSC by default; keep client JS small                                                              |
| Forms/validation | React Hook Form + Zod                                                                 | Zod schemas shared between server and client                                                      |
| Database         | PostgreSQL on Neon (serverless) + Prisma 7                                            | `pg` driver via `@prisma/adapter-pg`; Neon pooled connection string in Lambda; free tier to start |
| Auth             | Auth.js v5 — credentials (bcrypt) + Google                                            | Roles: `CUSTOMER`, `ADMIN`                                                                        |
| Payments         | Stripe or Razorpay (decide in Phase 3), hosted checkout + webhooks                    | Webhook is the source of truth for payment status; see "Region: India"                            |
| Images           | `next/image` + S3 + CloudFront                                                        |                                                                                                   |
| Email            | Resend + React Email                                                                  | Order confirmations                                                                               |
| Background jobs  | SQS + Lambda / EventBridge                                                            | Post-payment work, retries                                                                        |
| Testing          | Vitest + Testing Library, Playwright (E2E), Dockerized Postgres for integration tests |                                                                                                   |
| Quality          | ESLint, Prettier, Husky + lint-staged, GitHub Actions                                 |                                                                                                   |
| Infra / deploy   | SST v3 (OpenNext) → Lambda + CloudFront + S3; Secrets Manager; CloudWatch             | Pay-per-use, ~$0 idle                                                                             |

### Why these choices

- **Next.js over Java/Spring:** the app is UI-heavy; React + RSC gives the best storefront UX in a single codebase.
- **Lambda over containers:** near-zero idle cost. Cold starts (~300–800ms) are acceptable at small scale; mitigate with streaming, provisioned concurrency later if needed.
- **Neon Postgres over DynamoDB:** same ~$0 idle cost, but keeps rich filtering/sorting/search and ad-hoc queries, which a storefront depends on. Avoids upfront access-pattern lock-in. DB access is isolated behind `src/server/db` so this can change later.

## Architecture

```
Browser ──► CloudFront ──► Lambda (Next.js server via OpenNext)
                │                │
                ├─► S3 (static assets, product images)
                │                ├─► Neon Postgres (Prisma 7, pg adapter, pooled connection)
                │                ├─► Payment gateway (hosted checkout, webhooks)
                │                └─► SQS ──► Lambda workers (email, stock, retries)
                └─► Route53 + ACM (domain, HTTPS)
```

## Project structure

```
src/
  app/                  # routes (App Router)
    (storefront)/       # home, products, cart, checkout, account
    admin/              # admin dashboard
    api/                # route handlers (webhooks etc.)
  features/             # feature modules: ui + actions + schemas per domain
    catalog/ cart/ checkout/ orders/ auth/ admin/
  components/ui/        # shadcn primitives
  server/
    db/                 # Prisma client, repositories
    auth/               # Auth.js config
    payments/           # Stripe client + webhook handlers
  lib/                  # utils, env (Zod-validated), constants
prisma/                 # schema, migrations, seed
sst.config.ts           # infra
```

## Data model (v1)

- `User` (role: CUSTOMER | ADMIN), `Account`, `Session` (Auth.js)
- `Category`, `Product`, `ProductVariant` (size/color, price, stock), `ProductImage`
- `Cart`, `CartItem`
- `Address`
- `Order` (status: PENDING → PAID → FULFILLED | CANCELLED), `OrderItem`
- `Payment` (Stripe session/intent ids, status, amount — audit trail)

## Phases

### Phase 0 — Foundation

- [x] `create-next-app` (TS, Tailwind, App Router, `src/`), shadcn/ui, Prettier, Husky + lint-staged
- [x] Prisma 7 init (`prisma7.config.ts`, `@prisma/adapter-pg`); Docker Compose Postgres for local/integration tests
- [ ] Neon project created; `DATABASE_URL` set as SST secret
- [x] Zod-validated env config, `.env.example`, `.env.local`
- [x] Base layout: header with nav, search + cart badge; footer; `(storefront)` route group; placeholder home and `/products`
- [x] `sst.config.ts` (Nextjs component, `ap-south-1`, `DatabaseUrl` secret)
- [ ] First `sst deploy --stage dev` to confirm the Lambda pipeline (needs `aws configure`)
- [x] GitHub Actions: lint, typecheck, test, build
- [x] Vitest + Playwright configured with smoke tests (`pnpm exec playwright install chromium` before first e2e run)
- [x] CLAUDE.md with conventions and Next.js 16 notes

### Phase 1 — Storefront UI + Catalog

- [ ] Prisma models: Category, Product, ProductVariant, ProductImage; seed script with realistic data
- [ ] Home page (hero, featured, categories)
- [ ] `/products` — filters, sort, search with URL-driven state; skeletons + Suspense streaming
- [ ] `/products/[slug]` — gallery, variant picker, add to cart
- [ ] SEO metadata, OG images, sitemap
- [ ] Admin: `/admin/products` CRUD with image upload to S3

### Phase 2 — Cart, Checkout & Orders

- [ ] Cart: Zustand + localStorage for guests, merged into DB cart on login; slide-out drawer; optimistic updates
- [ ] Models: Cart, CartItem, Order, OrderItem, Address
- [ ] Checkout page (address, shipping method, summary) via Server Actions + Zod
- [ ] Order creation + stock reservation inside a Prisma transaction
- [ ] `/account/orders` history + detail; admin order list with status updates

### Phase 3 — Payments (Stripe or Razorpay)

- [ ] Pick the gateway (business entity registered → Stripe; otherwise Razorpay)
- [ ] Create a hosted checkout session from the order → redirect → `/checkout/success` and `/checkout/cancel`
- [ ] Webhook route handler for payment success / failure events → update Order + Payment
- [ ] Signature verification, idempotent event handling
- [ ] Post-payment work via SQS worker: confirmation email, stock decrement
- [ ] Local: Stripe CLI webhook forwarding

### Phase 4 — Security

- [ ] Auth.js: credentials (bcrypt) + Google; `src/proxy.ts` guarding `/account`, `/admin`
- [ ] Role checks inside every Server Action and admin route handler (never trust the client)
- [ ] Zod validation on every boundary; Prisma parameterized queries
- [ ] Rate limiting on login, checkout, webhooks (Upstash Ratelimit or DynamoDB-backed)
- [ ] Security headers + CSP in `next.config`; secrets only via env / Secrets Manager
- [ ] Dependabot / `npm audit` in CI; Playwright tests for auth and checkout flows

### Phase 5 — AWS deployment (production)

- [ ] SST v3: Next.js site (Lambda + CloudFront + S3), custom domain (Route53 + ACM), Secrets Manager for env
- [ ] Neon production branch; Prisma migrations run as a deploy step
- [ ] SQS queue + worker Lambda for background jobs
- [ ] S3 + CloudFront for product images
- [ ] CloudWatch logs/alarms; GitHub Actions deploy on `main`
- [ ] Later: WAF, provisioned concurrency if cold starts hurt, CloudFront caching for product pages

## Cost expectations (early stage)

- Lambda + CloudFront + S3: within free tier / low single-digit $ per month
- Neon: free tier
- Stripe: per-transaction fees only
- Route53: ~$0.50/mo per hosted zone; domain registration separate

## Region: India (INR)

- Currency: INR, stored as integer paise.
- Tax: GST. Stripe Tax does not support India, so GST (CGST/SGST/IGST by state, HSN-based rates) is implemented in-app and shown on invoices.
- Payment gateway (decide in Phase 3): Stripe India requires a registered business entity; **Razorpay** supports individuals and UPI/netbanking/cards natively. Keep `src/server/payments` gateway-agnostic so either fits.
- Locale: `en-IN` formatting, Indian address format (PIN code, state list).

## Open questions

- Shipping: flat rate vs. carrier rates
- Guest checkout allowed, or account required?
- Product search: Postgres full-text is fine to start; revisit if catalog grows large
