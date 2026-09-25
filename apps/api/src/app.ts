import type { ApiErrorBody } from "@ecom/shared";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { env } from "./env";
import { requireAdmin } from "./lib/auth";
import { db } from "./lib/db";
import { HttpError } from "./lib/errors";
import { categoryStoreRoutes, productStoreRoutes } from "./modules/products/store.routes";

/** Public API for the storefront. */
const store = new Hono()
  .route("/products", productStoreRoutes)
  .route("/categories", categoryStoreRoutes);

/** Admin API for the dashboard. Every route sits behind requireAdmin. */
const admin = new Hono().use(requireAdmin);

const api = new Hono()
  .get("/health", async (c) => {
    try {
      await db.$queryRaw`SELECT 1`;
      return c.json({ status: "ok", database: "ok" } as const, 200);
    } catch {
      return c.json({ status: "degraded", database: "unavailable" } as const, 503);
    }
  })
  .route("/store", store)
  .route("/admin", admin);

/** Route types consumed by @ecom/sdk. Paths are relative to /api. */
export type AppType = typeof api;

export const app = new Hono();

if (env.NODE_ENV !== "test") app.use(logger());

app.onError((error, c) => {
  if (error instanceof HttpError) {
    return c.json<ApiErrorBody>(
      { error: { code: error.code, message: error.message } },
      error.status,
    );
  }
  console.error(error);
  return c.json<ApiErrorBody>(
    { error: { code: "internal_error", message: "Something went wrong" } },
    500,
  );
});

app.notFound((c) =>
  c.json<ApiErrorBody>({ error: { code: "not_found", message: "Route not found" } }, 404),
);

app.route("/api", api);
