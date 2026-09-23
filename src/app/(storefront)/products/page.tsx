import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products",
};

export default function ProductsPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-semibold tracking-tight">Products</h1>
      <p className="text-muted-foreground">The catalog is coming in Phase 1.</p>
    </div>
  );
}
