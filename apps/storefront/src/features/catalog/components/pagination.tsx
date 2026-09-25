import type { ListProductsQuery } from "@ecom/shared";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { catalogHref } from "../search-params";

interface PaginationProps {
  query: ListProductsQuery;
  totalPages: number;
}

export function Pagination({ query, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null;
  const { page } = query;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-4 text-sm">
      {page > 1 ? (
        <Link
          href={catalogHref(query, { page: page - 1 })}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <ChevronLeft data-icon="inline-start" />
          Previous
        </Link>
      ) : (
        <span className={buttonVariants({ variant: "outline", size: "sm" })} aria-disabled>
          <ChevronLeft data-icon="inline-start" />
          Previous
        </span>
      )}
      <span className="text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={catalogHref(query, { page: page + 1 })}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Next
          <ChevronRight data-icon="inline-end" />
        </Link>
      ) : (
        <span className={buttonVariants({ variant: "outline", size: "sm" })} aria-disabled>
          Next
          <ChevronRight data-icon="inline-end" />
        </span>
      )}
    </nav>
  );
}
