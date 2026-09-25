import { listProductsQuerySchema } from "@ecom/shared";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createProduct, resetDatabase } from "../../../test/fixtures";
import { db } from "../../lib/db";
import { HttpError } from "../../lib/errors";
import { createProductService } from "./service";

const service = createProductService(db);
const query = (input: Record<string, unknown> = {}) => listProductsQuerySchema.parse(input);

beforeEach(() => resetDatabase(db));
afterAll(() => db.$disconnect());

describe("productService.list", () => {
  it("returns only published products, newest first", async () => {
    await createProduct(db, { handle: "old", createdAt: new Date("2026-01-01") });
    await createProduct(db, { handle: "new", createdAt: new Date("2026-02-01") });
    await createProduct(db, { handle: "draft", status: "DRAFT" });

    const result = await service.list(query());

    expect(result.items.map((p) => p.handle)).toEqual(["new", "old"]);
    expect(result.total).toBe(2);
  });

  it("filters by category handle", async () => {
    const shoes = await db.category.create({ data: { handle: "shoes", name: "Shoes" } });
    await createProduct(db, { handle: "sneaker", categoryId: shoes.id });
    await createProduct(db, { handle: "mug" });

    const result = await service.list(query({ category: "shoes" }));

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      handle: "sneaker",
      category: { handle: "shoes", name: "Shoes" },
    });
  });

  it("searches title case-insensitively", async () => {
    await createProduct(db, { handle: "a", title: "Linen Shirt" });
    await createProduct(db, { handle: "b", title: "Cotton Kurta" });

    const result = await service.list(query({ q: "linen" }));

    expect(result.items.map((p) => p.handle)).toEqual(["a"]);
  });

  it("sorts by lowest variant price", async () => {
    await createProduct(db, { handle: "mid", variants: [{ sku: "m", pricePaise: 50_000 }] });
    await createProduct(db, {
      handle: "cheap",
      variants: [
        { sku: "c1", pricePaise: 90_000 },
        { sku: "c2", pricePaise: 10_000 },
      ],
    });

    const asc = await service.list(query({ sort: "price_asc" }));
    const desc = await service.list(query({ sort: "price_desc" }));

    expect(asc.items.map((p) => p.handle)).toEqual(["cheap", "mid"]);
    expect(desc.items.map((p) => p.handle)).toEqual(["mid", "cheap"]);
  });

  it("paginates", async () => {
    for (let i = 0; i < 5; i++) await createProduct(db, { handle: `p${i}` });

    const page2 = await service.list(query({ page: 2, limit: 2 }));

    expect(page2.items).toHaveLength(2);
    expect(page2).toMatchObject({ page: 2, limit: 2, total: 5, totalPages: 3 });
  });
});

describe("productService.retrieveByHandle", () => {
  it("returns variants with availability instead of stock counts", async () => {
    await createProduct(db, {
      handle: "tee",
      variants: [
        { sku: "tee-s", pricePaise: 70_000, stock: 3 },
        { sku: "tee-m", pricePaise: 70_000, stock: 0 },
      ],
    });

    const product = await service.retrieveByHandle("tee");

    expect(product.variants.map((v) => [v.sku, v.inStock])).toEqual([
      ["tee-s", true],
      ["tee-m", false],
    ]);
    expect(product.variants[0]).not.toHaveProperty("stock");
  });

  it("throws 404 for drafts and unknown handles", async () => {
    await createProduct(db, { handle: "secret", status: "DRAFT" });

    for (const handle of ["secret", "missing"]) {
      await expect(service.retrieveByHandle(handle)).rejects.toMatchObject({ status: 404 });
      await expect(service.retrieveByHandle(handle)).rejects.toBeInstanceOf(HttpError);
    }
  });
});
