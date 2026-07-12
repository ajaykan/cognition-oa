import Link from "next/link";
import { requireUser } from "@/lib/session";
import { appsForRole } from "@/lib/rbac";
import { RoleBadge } from "@/components/badges";
import { SideNav } from "@/components/nav";
import { logout } from "../login/actions";

export default async function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const apps = appsForRole(user.role);

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="text-sm font-semibold text-slate-900">
            Acme Internal Tools
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-900">{user.name}</div>
              <div className="text-xs text-slate-500">{user.email}</div>
            </div>
            <RoleBadge role={user.role} />
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Switch user
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-6 py-6">
        <aside className="w-56 shrink-0">
          <SideNav apps={apps} />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
