import Link from "next/link";
import { requireUser } from "@/lib/session";
import { appsForRole } from "@/lib/rbac";

export default async function HomePage() {
  const user = await requireUser();
  const apps = appsForRole(user.role);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">
        Welcome, {user.name.split(" ")[0]}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        The tools available to your role are listed below.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {apps.map((app) => (
          <Link
            key={app.id}
            href={app.href}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            <div className="text-sm font-semibold text-slate-900">{app.name}</div>
            <div className="mt-1 text-sm text-slate-500">{app.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
