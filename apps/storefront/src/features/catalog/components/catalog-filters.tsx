import type { CategoryDto, ListProductsQuery, ProductSort } from "@ecom/shared";
import { cn } from "cn";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { catalogHref } from "../search-params";

const sortLabels: Record<ProductSort, string> = {
  newest: "Newest",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
};

interface CatalogFiltersProps {
  query: ListProductsQuery;
  categories: CategoryDto[];
}

export function CatalogFilters({ query, categories }: CatalogFiltersProps) {
  const categoryLinks = [{ handle: undefined, name: "All" }, ...categories];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <nav aria-label="Categories" className="flex flex-wrap gap-2">
        {categoryLinks.map((category) => {
          const active = query.category === category.handle;
          return (
            <Link
              key={category.handle ?? "all"}
              href={catalogHref(query, { category: category.handle })}
              aria-current={active ? "page" : undefined}
              className={buttonVariants({ variant: active ? "default" : "outline", size: "sm" })}
            >
              {category.name}
            </Link>
          );
        })}
      </nav>

      <nav aria-label="Sort" className="flex flex-wrap items-center gap-1 text-sm">
        <span className="mr-1 text-muted-foreground">Sort:</span>
        {(Object.keys(sortLabels) as ProductSort[]).map((sort) => (
          <Link
            key={sort}
            href={catalogHref(query, { sort })}
            aria-current={query.sort === sort ? "true" : undefined}
            className={cn(
              "rounded-md px-2 py-1 hover:bg-muted",
              query.sort === sort && "font-medium text-foreground underline underline-offset-4",
              query.sort !== sort && "text-muted-foreground",
            )}
          >
            {sortLabels[sort]}
          </Link>
        ))}
      </nav>
    </div>
  );
}
