import { RefundStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAppAccess } from "@/lib/session";
import { canDecideRefund } from "@/lib/rbac";
import { formatDateTime, formatMoney } from "@/lib/format";
import { RefundStatusBadge } from "@/components/badges";
import { RefundActions } from "./refund-actions";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export default async function RefundsPage() {
  const user = await requireAppAccess("refunds");
  const canDecide = canDecideRefund(user.role);

  const refunds = await prisma.refundRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { decidedBy: true },
  });

  const pending = refunds.filter((r) => r.status === RefundStatus.pending);
  // Sum pending amounts. Currencies are mixed in seed data; for the summary we
  // total in USD-equivalent naively (POC — no FX conversion).
  const totalPendingCents = pending.reduce((sum, r) => sum + r.amountCents, 0);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Refunds Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">
        Approve or deny customer refund requests.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <StatCard label="Pending requests" value={String(pending.length)} />
        <StatCard
          label="Total pending amount"
          value={formatMoney(totalPendingCents, "USD")}
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Customer</th>
              <th className="px-4 py-2 font-medium">Amount</th>
              <th className="px-4 py-2 font-medium">Reason</th>
              <th className="px-4 py-2 font-medium">Created</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {refunds.map((r) => (
              <tr key={r.id} className="align-top hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {r.customerName}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-900">
                  {formatMoney(r.amountCents, r.currency)}
                </td>
                <td className="px-4 py-3 text-slate-600">{r.reason}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                  {formatDateTime(r.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <RefundStatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3">
                  {r.status === RefundStatus.pending ? (
                    canDecide ? (
                      <RefundActions id={r.id} />
                    ) : (
                      <span className="text-xs text-slate-400">View only</span>
                    )
                  ) : (
                    <span className="text-xs text-slate-400">
                      {r.decidedBy ? `by ${r.decidedBy.name}` : "—"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
