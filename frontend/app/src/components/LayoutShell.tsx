"use client";

import { usePathname } from "next/navigation";
import { SideBar } from "./SideBar";

const HIDE_SIDEBAR_PATHS = ["/", "/onboarding"];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = !HIDE_SIDEBAR_PATHS.includes(pathname);

  return (
    <div className="flex min-h-screen bg-navy-950">
      {showSidebar && <SideBar />}
      <main className={showSidebar ? "flex-1 pl-52" : "flex-1"}>
        {children}
      </main>
    </div>
  );
}
