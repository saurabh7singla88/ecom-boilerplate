import "server-only";
import { ApiError, unwrap } from "@ecom/sdk";
import type { ListProductsQuery } from "@ecom/shared";
import { connection } from "next/server";
import { cache } from "react";
import { api } from "@/lib/api";

// Catalog data is read from the API on every request for now.
// Caching (revalidate / cache tags) is revisited in Phase 7.

export async function listProducts(query: ListProductsQuery) {
  await connection();
  return unwrap(
    api.store.products.$get({
      query: {
        page: String(query.page),
        limit: String(query.limit),
        sort: query.sort,
        ...(query.category && { category: query.category }),
        ...(query.q && { q: query.q }),
      },
    }),
  );
}

export async function listCategories() {
  await connection();
  return unwrap(api.store.categories.$get());
}

/** Returns null when the product doesn't exist. Cached per request (page + metadata share it). */
export const getProduct = cache(async (handle: string) => {
  await connection();
  try {
    return await unwrap(api.store.products[":handle"].$get({ param: { handle } }));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
});
