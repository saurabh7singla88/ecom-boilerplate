/**
 * Development seed: a small, realistic catalog. Idempotent — safe to re-run.
 * Products are upserted by handle; their variants and images are replaced.
 * Images point at picsum.photos placeholders until uploads land in Phase 5.
 */
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { createDb } from "../src/index";

loadEnv({ path: fileURLToPath(new URL("../../../.env", import.meta.url)), quiet: true });

const url = process.env["DATABASE_URL"];
if (!url) throw new Error("DATABASE_URL is not set");

const db = createDb({ url });

const categories = [
  {
    handle: "apparel",
    name: "Apparel",
    description: "Everyday cotton and linen essentials.",
    position: 0,
  },
  {
    handle: "home-kitchen",
    name: "Home & Kitchen",
    description: "Handcrafted pieces for everyday living.",
    position: 1,
  },
  {
    handle: "accessories",
    name: "Accessories",
    description: "Bags, stationery and small things you'll use daily.",
    position: 2,
  },
];

interface SeedVariant {
  title: string;
  sku: string;
  pricePaise: number;
  compareAtPricePaise?: number;
  stock: number;
}

interface SeedProduct {
  handle: string;
  title: string;
  description: string;
  category: string;
  variants: SeedVariant[];
}

const sizes = (skuPrefix: string, pricePaise: number, stock: number[]): SeedVariant[] =>
  ["S", "M", "L", "XL"].map((size, i) => ({
    title: size,
    sku: `${skuPrefix}-${size}`,
    pricePaise,
    stock: stock[i] ?? 0,
  }));

const products: SeedProduct[] = [
  {
    handle: "classic-cotton-kurta",
    title: "Classic Cotton Kurta",
    description:
      "A breathable, straight-cut kurta in soft handloom cotton. Made for Indian summers.",
    category: "apparel",
    variants: sizes("KRT-CLS", 129_900, [8, 15, 12, 4]),
  },
  {
    handle: "linen-shirt-indigo",
    title: "Linen Shirt — Indigo",
    description:
      "Relaxed-fit pure linen shirt, naturally dyed with indigo. Gets softer with every wash.",
    category: "apparel",
    variants: sizes("SHT-LIN-IND", 189_900, [5, 9, 9, 3]).map((v) => ({
      ...v,
      compareAtPricePaise: 229_900,
    })),
  },
  {
    handle: "block-print-dupatta",
    title: "Block Print Dupatta",
    description: "Hand block-printed mulmul dupatta from Jaipur artisans. 2.25 m.",
    category: "apparel",
    variants: [{ title: "One size", sku: "DPT-BLK-01", pricePaise: 79_900, stock: 20 }],
  },
  {
    handle: "everyday-crew-tee",
    title: "Everyday Crew Tee",
    description: "Heavyweight 220 GSM organic cotton tee with a structured fit.",
    category: "apparel",
    variants: sizes("TEE-CRW", 69_900, [30, 40, 35, 0]),
  },
  {
    handle: "brass-diya-set",
    title: "Brass Diya Set (Set of 4)",
    description: "Hand-polished brass diyas made in Moradabad. Perfect for festive evenings.",
    category: "home-kitchen",
    variants: [{ title: "Set of 4", sku: "HOM-DYA-4", pricePaise: 99_900, stock: 25 }],
  },
  {
    handle: "terracotta-planter",
    title: "Terracotta Planter",
    description: "Unglazed terracotta planter with a drainage hole. Keeps roots cool and healthy.",
    category: "home-kitchen",
    variants: [
      { title: "Small — 6 in", sku: "HOM-TPL-S", pricePaise: 34_900, stock: 18 },
      { title: "Large — 10 in", sku: "HOM-TPL-L", pricePaise: 64_900, stock: 7 },
    ],
  },
  {
    handle: "copper-water-bottle",
    title: "Copper Water Bottle",
    description: "Pure copper bottle with a leak-proof cap. 950 ml.",
    category: "home-kitchen",
    variants: [
      {
        title: "950 ml",
        sku: "HOM-CPR-950",
        pricePaise: 89_900,
        compareAtPricePaise: 119_900,
        stock: 12,
      },
    ],
  },
  {
    handle: "handwoven-cotton-throw",
    title: "Handwoven Cotton Throw",
    description: "A soft, textured throw woven on handlooms in Panipat. 130 × 170 cm.",
    category: "home-kitchen",
    variants: [
      { title: "Ivory", sku: "HOM-THR-IVR", pricePaise: 149_900, stock: 6 },
      { title: "Rust", sku: "HOM-THR-RST", pricePaise: 149_900, stock: 0 },
    ],
  },
  {
    handle: "canvas-tote-bag",
    title: "Canvas Tote Bag",
    description: "Sturdy 12 oz canvas tote with an inner pocket. Carries your laptop and lunch.",
    category: "accessories",
    variants: [{ title: "Natural", sku: "ACC-TOT-NAT", pricePaise: 49_900, stock: 40 }],
  },
  {
    handle: "handmade-paper-journal",
    title: "Handmade Paper Journal",
    description: "A5 journal with 160 pages of recycled cotton-rag paper and a leather-look cover.",
    category: "accessories",
    variants: [
      { title: "Plain", sku: "ACC-JRN-PLN", pricePaise: 44_900, stock: 22 },
      { title: "Dotted", sku: "ACC-JRN-DOT", pricePaise: 44_900, stock: 14 },
    ],
  },
];

async function main() {
  const categoryIds = new Map<string, string>();
  for (const category of categories) {
    const { id } = await db.category.upsert({
      where: { handle: category.handle },
      update: category,
      create: category,
    });
    categoryIds.set(category.handle, id);
  }

  for (const product of products) {
    const minPricePaise = Math.min(...product.variants.map((v) => v.pricePaise));
    const data = {
      title: product.title,
      description: product.description,
      status: "PUBLISHED" as const,
      minPricePaise,
      categoryId: categoryIds.get(product.category) ?? null,
    };
    const images = [0, 1, 2].map((i) => ({
      url: `https://picsum.photos/seed/${product.handle}-${i}/800/1000`,
      alt: `${product.title} — image ${i + 1}`,
      position: i,
    }));
    const variants = product.variants.map((variant, position) => ({ ...variant, position }));

    await db.$transaction(async (tx) => {
      const { id } = await tx.product.upsert({
        where: { handle: product.handle },
        update: data,
        create: { handle: product.handle, ...data },
      });
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productVariant.createMany({ data: variants.map((v) => ({ ...v, productId: id })) });
      await tx.productImage.createMany({ data: images.map((img) => ({ ...img, productId: id })) });
    });
  }

  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
