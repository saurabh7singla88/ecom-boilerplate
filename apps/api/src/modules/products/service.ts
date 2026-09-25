import type { Db, Prisma } from "@ecom/db";
import type {
  CategoryDto,
  ListProductsQuery,
  Paginated,
  ProductDto,
  ProductSort,
  ProductSummaryDto,
} from "@ecom/shared";
import { notFound } from "../../lib/errors";

const imageSelect = { url: true, alt: true } satisfies Prisma.ProductImageSelect;

const summarySelect = {
  id: true,
  handle: true,
  title: true,
  minPricePaise: true,
  category: { select: { handle: true, name: true } },
  images: { select: imageSelect, orderBy: { position: "asc" }, take: 1 },
} satisfies Prisma.ProductSelect;

const detailSelect = {
  ...summarySelect,
  description: true,
  images: { select: imageSelect, orderBy: { position: "asc" } },
  variants: {
    select: {
      id: true,
      title: true,
      sku: true,
      pricePaise: true,
      compareAtPricePaise: true,
      stock: true,
    },
    orderBy: { position: "asc" },
  },
} satisfies Prisma.ProductSelect;

// `id` breaks ties so pagination is stable.
const orderBy: Record<ProductSort, Prisma.ProductOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }, { id: "asc" }],
  price_asc: [{ minPricePaise: "asc" }, { id: "asc" }],
  price_desc: [{ minPricePaise: "desc" }, { id: "asc" }],
};

type SummaryRow = Prisma.ProductGetPayload<{ select: typeof summarySelect }>;
type DetailRow = Prisma.ProductGetPayload<{ select: typeof detailSelect }>;

function toSummary(row: SummaryRow): ProductSummaryDto {
  return {
    id: row.id,
    handle: row.handle,
    title: row.title,
    minPricePaise: row.minPricePaise,
    thumbnail: row.images[0] ?? null,
    category: row.category,
  };
}

function toDetail(row: DetailRow): ProductDto {
  return {
    ...toSummary(row),
    description: row.description,
    images: row.images,
    variants: row.variants.map(({ stock, ...variant }) => ({ ...variant, inStock: stock > 0 })),
  };
}

export function createProductService(db: Db) {
  return {
    /** Published products for the storefront, filtered, sorted and paginated. */
    async list(query: ListProductsQuery): Promise<Paginated<ProductSummaryDto>> {
      const where: Prisma.ProductWhereInput = {
        status: "PUBLISHED",
        ...(query.category && { category: { handle: query.category } }),
        ...(query.q && {
          OR: [
            { title: { contains: query.q, mode: "insensitive" } },
            { description: { contains: query.q, mode: "insensitive" } },
          ],
        }),
      };

      const [rows, total] = await db.$transaction([
        db.product.findMany({
          where,
          select: summarySelect,
          orderBy: orderBy[query.sort],
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
        db.product.count({ where }),
      ]);

      return {
        items: rows.map(toSummary),
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      };
    },

    /** A single published product by its URL handle. */
    async retrieveByHandle(handle: string): Promise<ProductDto> {
      const row = await db.product.findFirst({
        where: { handle, status: "PUBLISHED" },
        select: detailSelect,
      });
      if (!row) throw notFound(`Product "${handle}" not found`);
      return toDetail(row);
    },

    async listCategories(): Promise<CategoryDto[]> {
      return db.category.findMany({
        select: { id: true, handle: true, name: true, description: true },
        orderBy: [{ position: "asc" }, { name: "asc" }],
      });
    },
  };
}

export type ProductService = ReturnType<typeof createProductService>;
