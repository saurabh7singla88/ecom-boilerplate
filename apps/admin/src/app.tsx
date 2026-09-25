import { LayoutDashboard, Package, ShoppingCart, Users, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "./lib/api";

interface NavItem {
  label: string;
  icon: LucideIcon;
  /** Build phase that adds the screen (see PLAN.md). */
  phase?: string;
}

const nav: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Products", icon: Package, phase: "Phase 5" },
  { label: "Orders", icon: ShoppingCart, phase: "Phase 5" },
  { label: "Customers", icon: Users, phase: "Phase 5" },
];

type ApiStatus = "checking" | "ok" | "degraded" | "unreachable";

async function fetchApiStatus(): Promise<ApiStatus> {
  try {
    const res = await api.health.$get();
    const body = await res.json();
    return body.status;
  } catch {
    return "unreachable";
  }
}

function useApiStatus(): ApiStatus {
  const [status, setStatus] = useState<ApiStatus>("checking");

  useEffect(() => {
    let cancelled = false;
    void fetchApiStatus().then((next) => {
      if (!cancelled) setStatus(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}

const statusStyles: Record<ApiStatus, string> = {
  checking: "bg-neutral-300",
  ok: "bg-emerald-500",
  degraded: "bg-amber-500",
  unreachable: "bg-red-500",
};

export function App() {
  const status = useApiStatus();

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      <aside className="hidden w-60 shrink-0 flex-col gap-6 border-r bg-white p-4 md:flex">
        <p className="px-2 text-lg font-semibold tracking-tight">Storefront Admin</p>
        <nav aria-label="Admin" className="flex flex-col gap-1">
          {nav.map(({ label, icon: Icon, phase }) => (
            <span
              key={label}
              aria-disabled={phase ? true : undefined}
              className={
                phase
                  ? "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-neutral-400"
                  : "flex items-center gap-2 rounded-lg bg-neutral-100 px-2 py-1.5 text-sm font-medium"
              }
            >
              <Icon className="size-4" aria-hidden />
              {label}
              {phase && <span className="ml-auto text-[10px] uppercase">{phase}</span>}
            </span>
          ))}
        </nav>
      </aside>

      <main className="flex flex-1 flex-col gap-8 p-6 sm:p-10">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-neutral-500">
            Admin screens arrive with sign-in (Phase 3) and the admin API (Phase 5).
          </p>
        </header>

        <section className="max-w-sm rounded-xl border bg-white p-5">
          <h2 className="text-sm font-medium text-neutral-500">API status</h2>
          <p className="mt-2 flex items-center gap-2 text-lg font-medium capitalize">
            <span className={`size-2.5 rounded-full ${statusStyles[status]}`} aria-hidden />
            {status}
          </p>
        </section>
      </main>
    </div>
  );
}
