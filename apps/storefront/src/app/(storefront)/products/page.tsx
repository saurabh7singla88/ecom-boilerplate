import type { Metadata } from "next";
import { CatalogFilters } from "@/features/catalog/components/catalog-filters";
import { Pagination } from "@/features/catalog/components/pagination";
import { ProductGrid } from "@/features/catalog/components/product-card";
import { listCategories, listProducts } from "@/features/catalog/queries";
import { parseCatalogParams } from "@/features/catalog/search-params";

export const metadata: Metadata = {
  title: "Products",
};

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const query = parseCatalogParams(await searchParams);
  const [page, categories] = await Promise.all([listProducts(query), listCategories()]);
  const category = categories.find((c) => c.handle === query.category);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {category?.name ?? "All products"}
        </h1>
        <p className="text-muted-foreground">
          {category?.description || "Everything in the store, in one place."}
        </p>
      </header>

      <CatalogFilters query={query} categories={categories} />

      {page.items.length > 0 ? (
        <ProductGrid products={page.items} />
      ) : (
        <p className="py-16 text-center text-muted-foreground">No products match these filters.</p>
      )}

      <Pagination query={query} totalPages={page.totalPages} />
    </div>
  );
}
