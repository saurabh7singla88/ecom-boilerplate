import type { Db } from "@ecom/db";

/** Empties every table touched by the tests. */
export async function resetDatabase(db: Db) {
  await db.$executeRawUnsafe(
    'TRUNCATE "ProductImage", "ProductVariant", "Product", "Category" RESTART IDENTITY CASCADE',
  );
}

interface ProductFixture {
  handle: string;
  title?: string;
  status?: "DRAFT" | "PUBLISHED";
  categoryId?: string;
  createdAt?: Date;
  variants?: { sku: string; pricePaise: number; stock?: number }[];
}

export async function createProduct(db: Db, fixture: ProductFixture) {
  const variants = fixture.variants ?? [
    { sku: `${fixture.handle}-sku`, pricePaise: 10_000, stock: 5 },
  ];
  return db.product.create({
    data: {
      handle: fixture.handle,
      title: fixture.title ?? fixture.handle,
      status: fixture.status ?? "PUBLISHED",
      categoryId: fixture.categoryId,
      createdAt: fixture.createdAt,
      minPricePaise: Math.min(...variants.map((v) => v.pricePaise)),
      variants: {
        create: variants.map((v, position) => ({
          title: v.sku,
          sku: v.sku,
          pricePaise: v.pricePaise,
          stock: v.stock ?? 5,
          position,
        })),
      },
      images: {
        create: [{ url: `https://example.com/${fixture.handle}.jpg`, alt: fixture.handle }],
      },
    },
  });
}
