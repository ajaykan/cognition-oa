"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AppMeta } from "@/lib/rbac";

export function SideNav({ apps }: { apps: AppMeta[] }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      <Link
        href="/"
        className={linkClass(pathname === "/")}
      >
        Home
      </Link>
      {apps.map((app) => {
        const active = pathname === app.href || pathname.startsWith(`${app.href}/`);
        return (
          <Link key={app.id} href={app.href} className={linkClass(active)}>
            {app.name}
          </Link>
        );
      })}
    </nav>
  );
}

function linkClass(active: boolean): string {
  return [
    "block rounded-md px-3 py-2 text-sm font-medium transition",
    active
      ? "bg-slate-900 text-white"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");
}
