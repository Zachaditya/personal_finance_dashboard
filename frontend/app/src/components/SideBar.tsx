"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getStorage } from "../lib/storage";

const navItems = [
  { href: "/health", label: "Health", pathMatch: ["/health"], icon: "◆" },
  {
    href: "/pdashboard",
    label: "Portfolio",
    pathMatch: ["/pdashboard"],
    icon: "▣",
  },
  { href: "/advisor", label: "AI Advisor", pathMatch: ["/advisor"], icon: "◈" },
] as const;

export function SideBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const h = searchParams.get("h");
  const [savedHoldings, setSavedHoldings] = useState<string | null>(null);

  useEffect(() => {
    try {
      setSavedHoldings(localStorage.getItem("lastHoldings"));
    } catch { /* ignore */ }
  }, []);

  const effectiveH = h ?? savedHoldings;

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-52 flex-col border-r border-[#e5e7eb] bg-white shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-[#e5e7eb] px-5 py-4">
        <span className="text-gold-400 text-lg leading-none">◈</span>
        <span className="text-sm font-semibold text-ink-1 tracking-tight">
          Finfolio
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {navItems.map(({ href, label, pathMatch, icon }) => {
          const isActive = pathMatch.some((p) => pathname.startsWith(p));
          const dashboardHref =
            href === "/pdashboard" && effectiveH
              ? `/pdashboard?h=${effectiveH}`
              : href;

          return (
            <Link
              key={href}
              href={dashboardHref}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gold-400/10 text-gold-400 ring-1 ring-gold-400/20"
                  : "text-ink-3 hover:bg-navy-800 hover:text-ink-2"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="text-base opacity-75">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Select assets link at bottom */}
      <div className="border-t border-[#e5e7eb] p-3">
        <Link
          href="/select"
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            pathname === "/select"
              ? "bg-gold-400/10 text-gold-400 ring-1 ring-gold-400/20"
              : "text-ink-3 hover:bg-navy-800 hover:text-ink-2"
          }`}
        >
          <span className="text-base opacity-75">＋</span>
          Select Assets
        </Link>
      </div>
    </aside>
  );
}
