import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAppAccess } from "@/lib/session";
import { formatDateTime } from "@/lib/format";
import { RoleBadge } from "@/components/badges";
import { BeforeAfterDiff } from "@/components/audit-diff";

const ENTITY_TYPES = ["KycApplication", "RefundRequest"];

export default async function AuditPage(props: {
  searchParams: Promise<{ actorId?: string; entityType?: string }>;
}) {
  await requireAppAccess("audit");
  const { actorId, entityType } = await props.searchParams;

  const where: Prisma.AuditLogWhereInput = {};
  if (actorId) where.actorId = actorId;
  if (entityType) where.entityType = entityType;

  const [logs, users] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { actor: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Audit Log</h1>
      <p className="mt-1 text-sm text-slate-500">
        Append-only record of every state-changing action across all tools.
      </p>

      <form
        method="get"
        className="mt-5 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4"
      >
        <label className="flex flex-col text-xs font-medium text-slate-600">
          Actor
          <select
            name="actorId"
            defaultValue={actorId ?? ""}
            className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">All actors</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs font-medium text-slate-600">
          Entity type
          <select
            name="entityType"
            defaultValue={entityType ?? ""}
            className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">All entities</option>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Apply
        </button>
        <a
          href="/audit"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Reset
        </a>
        <span className="ml-auto text-xs text-slate-400">{logs.length} entries</span>
      </form>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">When</th>
              <th className="px-4 py-2 font-medium">Actor</th>
              <th className="px-4 py-2 font-medium">Action</th>
              <th className="px-4 py-2 font-medium">Entity</th>
              <th className="px-4 py-2 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No audit entries match the current filters.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                  {formatDateTime(log.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-slate-900">{log.actor.name}</div>
                  <RoleBadge role={log.actor.role} />
                </td>
                <td className="px-4 py-3">
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                    {log.action}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs text-slate-500">{log.entityType}</div>
                  <div className="font-mono text-xs text-slate-400">{log.entityId}</div>
                </td>
                <td className="px-4 py-3">
                  <details className="group">
                    <summary className="cursor-pointer text-xs font-medium text-blue-600 hover:underline">
                      View before / after
                    </summary>
                    <div className="mt-2 rounded-md border border-slate-200 p-3">
                      {log.reason && (
                        <div className="mb-2 text-xs text-slate-600">
                          <span className="font-medium">Reason:</span> {log.reason}
                        </div>
                      )}
                      <BeforeAfterDiff before={log.before} after={log.after} />
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
