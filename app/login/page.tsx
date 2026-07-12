import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { appsForRole } from "@/lib/rbac";
import { RoleBadge } from "@/components/badges";
import { loginAs } from "./actions";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");

  const users = await prisma.user.findMany({ orderBy: { role: "asc" } });

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Acme Internal Tools</h1>
          <p className="mt-2 text-sm text-slate-500">
            Prototype platform — pick a user to sign in as.
          </p>
        </div>

        <div className="space-y-3">
          {users.map((user) => {
            const apps = appsForRole(user.role);
            return (
              <form key={user.id} action={loginAs}>
                <input type="hidden" name="userId" value={user.id} />
                <button
                  type="submit"
                  className="group flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-slate-300 hover:shadow"
                >
                  <span>
                    <span className="block text-sm font-medium text-slate-900">
                      {user.name}
                    </span>
                    <span className="block text-xs text-slate-500">{user.email}</span>
                    <span className="mt-1 block text-xs text-slate-400">
                      Can access: {apps.map((a) => a.name).join(", ")}
                    </span>
                  </span>
                  <span className="ml-3 shrink-0">
                    <RoleBadge role={user.role} />
                  </span>
                </button>
              </form>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          No password required. This is a demo session cookie, not real
          authentication.
        </p>
      </div>
    </main>
  );
}
