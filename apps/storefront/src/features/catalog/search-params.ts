import { listProductsQuerySchema, type ListProductsQuery } from "@ecom/shared";

type RawSearchParams = Record<string, string | string[] | undefined>;

/** Parses /products search params, falling back to defaults for anything invalid. */
export function parseCatalogParams(params: RawSearchParams): ListProductsQuery {
  const flat = Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );
  const parsed = listProductsQuerySchema.safeParse(flat);
  return parsed.success ? parsed.data : listProductsQuerySchema.parse({});
}

/** Builds a /products link that keeps the current filters and applies `changes`. */
export function catalogHref(current: ListProductsQuery, changes: Partial<ListProductsQuery>) {
  const next = { ...current, page: 1, ...changes };
  const query: Record<string, string> = {};
  if (next.category) query.category = next.category;
  if (next.q) query.q = next.q;
  if (next.sort !== "newest") query.sort = next.sort;
  if (next.page > 1) query.page = String(next.page);
  return { pathname: "/products" as const, query };
}
