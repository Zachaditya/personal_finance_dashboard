"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const navItems = [
  { href: "/", label: "Select Assets", pathMatch: ["/", "/select"] },
  { href: "/dashboard", label: "Dashboard", pathMatch: ["/dashboard"] },
] as const;

export function SideBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const h = searchParams.get("h");

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-56 flex-col border-r border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <div className="flex items-center gap-2.5 border-b border-slate-800 px-5 py-4">
        <span className="text-emerald-400 text-lg leading-none">◈</span>
        <span className="text-sm font-semibold text-slate-100 tracking-tight">
          Portfolio Dashboard
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {navItems.map(({ href, label, pathMatch }) => {
          const isActive = pathMatch.some((p) =>
            p === "/" ? pathname === "/" : pathname.startsWith(p)
          );
          const dashboardHref =
            href === "/dashboard" && h ? `/dashboard?h=${h}` : href;
          const isDashboardDisabled =
            href === "/dashboard" && !h && pathname !== "/dashboard";

          return (
            <Link
              key={href}
              href={isDashboardDisabled ? "#" : dashboardHref}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isDashboardDisabled
                  ? "cursor-not-allowed text-slate-600"
                  : isActive
                    ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                    : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
              }`}
              aria-current={isActive ? "page" : undefined}
              onClick={(e) => isDashboardDisabled && e.preventDefault()}
            >
              <span className="text-base opacity-80">
                {label === "Select Assets" ? "◇" : "▣"}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
