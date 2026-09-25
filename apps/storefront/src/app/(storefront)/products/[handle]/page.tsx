import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VariantPicker } from "@/features/catalog/components/variant-picker";
import { getProduct } from "@/features/catalog/queries";

export async function generateMetadata({
  params,
}: PageProps<"/products/[handle]">): Promise<Metadata> {
  const product = await getProduct((await params).handle);
  if (!product) return {};
  return { title: product.title, description: product.description };
}

export default async function ProductPage({ params }: PageProps<"/products/[handle]">) {
  const product = await getProduct((await params).handle);
  if (!product) notFound();

  const [cover, ...rest] = product.images;

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div className="flex flex-col gap-3">
        <div className="relative aspect-4/5 overflow-hidden rounded-xl bg-muted">
          {cover && (
            <Image
              src={cover.url}
              alt={cover.alt}
              fill
              preload
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          )}
        </div>
        {rest.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {rest.map((image) => (
              <div
                key={image.url}
                className="relative aspect-4/5 overflow-hidden rounded-lg bg-muted"
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 768px) 16vw, 33vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {product.category && (
          <Link
            href={{ pathname: "/products", query: { category: product.category.handle } }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {product.category.name}
          </Link>
        )}
        <h1 className="text-3xl font-semibold tracking-tight">{product.title}</h1>
        <VariantPicker variants={product.variants} />
        <p className="leading-relaxed text-muted-foreground">{product.description}</p>
      </div>
    </div>
  );
}
