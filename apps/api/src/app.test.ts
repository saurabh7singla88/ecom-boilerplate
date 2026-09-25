import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createProduct, resetDatabase } from "../test/fixtures";
import { app } from "./app";
import { db } from "./lib/db";

beforeEach(() => resetDatabase(db));
afterAll(() => db.$disconnect());

describe("API routes", () => {
  it("GET /api/health reports the database status", async () => {
    const res = await app.request("/api/health");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok", database: "ok" });
  });

  it("GET /api/store/products returns a page of products", async () => {
    await createProduct(db, { handle: "kurta" });

    const res = await app.request("/api/store/products?limit=5");

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      items: [{ handle: "kurta" }],
      page: 1,
      limit: 5,
      total: 1,
    });
  });

  it("rejects invalid query params with the standard error shape", async () => {
    const res = await app.request("/api/store/products?sort=cheapest");

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: { code: "bad_request" } });
  });

  it("returns 404 for an unknown product", async () => {
    const res = await app.request("/api/store/products/nope");

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      error: { code: "not_found", message: 'Product "nope" not found' },
    });
  });

  it("locks every admin route until auth exists", async () => {
    const res = await app.request("/api/admin/anything");

    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ error: { code: "unauthorized" } });
  });

  it("returns JSON 404 for unknown routes", async () => {
    const res = await app.request("/api/nope");

    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ error: { code: "not_found" } });
  });
});
