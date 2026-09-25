import { formatPaise, type ProductSummaryDto } from "@ecom/shared";
import Image from "next/image";
import Link from "next/link";

export function ProductCard({ product }: { product: ProductSummaryDto }) {
  return (
    <Link href={`/products/${product.handle}`} className="group flex flex-col gap-3">
      <div className="relative aspect-4/5 overflow-hidden rounded-xl bg-muted">
        {product.thumbnail && (
          <Image
            src={product.thumbnail.url}
            alt={product.thumbnail.alt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        {product.category && (
          <p className="text-xs text-muted-foreground">{product.category.name}</p>
        )}
        <h3 className="font-medium">{product.title}</h3>
        <p className="text-sm text-muted-foreground">From {formatPaise(product.minPricePaise)}</p>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: ProductSummaryDto[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
