"use client";

import { formatPaise, type ProductVariantDto } from "@ecom/shared";
import { cn } from "cn";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function VariantPicker({ variants }: { variants: ProductVariantDto[] }) {
  const [selectedId, setSelectedId] = useState(
    () => (variants.find((v) => v.inStock) ?? variants[0])?.id,
  );
  const selected = variants.find((v) => v.id === selectedId);
  if (!selected) return null;

  return (
    <div className="flex flex-col gap-6">
      <p className="flex items-baseline gap-3">
        <span className="text-2xl font-semibold">{formatPaise(selected.pricePaise)}</span>
        {selected.compareAtPricePaise && (
          <span className="text-muted-foreground line-through">
            {formatPaise(selected.compareAtPricePaise)}
          </span>
        )}
        <span className="text-xs text-muted-foreground">Inclusive of GST</span>
      </p>

      {variants.length > 1 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Options</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <label
                key={variant.id}
                className={cn(
                  "cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                  variant.id === selectedId
                    ? "border-foreground bg-foreground text-background"
                    : "hover:bg-muted",
                  !variant.inStock && "text-muted-foreground line-through",
                )}
              >
                <input
                  type="radio"
                  name="variant"
                  value={variant.id}
                  checked={variant.id === selectedId}
                  onChange={() => setSelectedId(variant.id)}
                  className="sr-only"
                />
                {variant.title}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Cart arrives in Phase 2. */}
      <Button size="lg" disabled className="w-full sm:w-auto">
        {selected.inStock ? "Add to cart — coming soon" : "Out of stock"}
      </Button>
    </div>
  );
}
