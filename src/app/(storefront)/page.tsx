import { ArrowRight, CreditCard, RotateCcw, Truck } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { formatPaise } from "@/lib/format";
import { siteConfig } from "@/lib/site";

const FREE_SHIPPING_THRESHOLD_PAISE = 99_900;

const highlights = [
  {
    icon: Truck,
    title: "Free shipping",
    description: `On orders over ${formatPaise(FREE_SHIPPING_THRESHOLD_PAISE)}, anywhere in India.`,
  },
  {
    icon: CreditCard,
    title: "Pay your way",
    description: "UPI, cards, net banking and wallets — all in INR.",
  },
  {
    icon: RotateCcw,
    title: "Easy returns",
    description: "7-day hassle-free returns on every order.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col items-start gap-6 py-10 sm:py-20">
        <p className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
          {siteConfig.name}
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          Everything you love, delivered across India.
        </h1>
        <p className="max-w-xl text-lg text-pretty text-muted-foreground">
          {siteConfig.description} Thoughtfully curated products, transparent pricing, and a
          checkout that just works.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/products" className={buttonVariants({ size: "lg" })}>
            Browse products
            <ArrowRight data-icon="inline-end" />
          </Link>
          <Link href="/" className={buttonVariants({ size: "lg", variant: "outline" })}>
            Learn more
          </Link>
        </div>
      </section>

      <section aria-labelledby="highlights" className="grid gap-6 sm:grid-cols-3">
        <h2 id="highlights" className="sr-only">
          Why shop with us
        </h2>
        {highlights.map(({ icon: Icon, title, description }) => (
          <div key={title} className="rounded-xl border bg-card p-6">
            <Icon className="mb-4 size-6 text-muted-foreground" aria-hidden />
            <h3 className="font-medium">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
