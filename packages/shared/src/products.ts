import { z } from "zod";
import { paginationQuerySchema } from "./api";

// ─── Queries ─────────────────────────────────────────────────────────────────

export const productSortValues = ["newest", "price_asc", "price_desc"] as const;
export type ProductSort = (typeof productSortValues)[number];

export const listProductsQuerySchema = paginationQuerySchema.extend({
  category: z.string().trim().min(1).optional(),
  q: z.string().trim().min(1).max(100).optional(),
  sort: z.enum(productSortValues).default("newest"),
});
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

// ─── Responses ───────────────────────────────────────────────────────────────

export interface CategoryDto {
  id: string;
  handle: string;
  name: string;
  description: string;
}

export interface ProductImageDto {
  url: string;
  alt: string;
}

export interface ProductVariantDto {
  id: string;
  title: string;
  sku: string;
  pricePaise: number;
  compareAtPricePaise: number | null;
  /** Stock counts stay private; the storefront only needs availability. */
  inStock: boolean;
}

/** A product as shown in listings. */
export interface ProductSummaryDto {
  id: string;
  handle: string;
  title: string;
  minPricePaise: number;
  thumbnail: ProductImageDto | null;
  category: Pick<CategoryDto, "handle" | "name"> | null;
}

/** A product as shown on its detail page. */
export interface ProductDto extends ProductSummaryDto {
  description: string;
  images: ProductImageDto[];
  variants: ProductVariantDto[];
}
