import Link from "next/link";
import { KycStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAppAccess } from "@/lib/session";
import { formatDateTime } from "@/lib/format";
import { KycStatusBadge, RiskScoreBadge, RiskFlagBadge } from "@/components/badges";

const TABS: { status: KycStatus; label: string }[] = [
  { status: KycStatus.pending, label: "Pending" },
  { status: KycStatus.escalated, label: "Escalated" },
  { status: KycStatus.approved, label: "Approved" },
  { status: KycStatus.rejected, label: "Rejected" },
];

function parseFlags(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export default async function KycQueuePage(props: {
  searchParams: Promise<{ status?: string; sort?: string }>;
}) {
  await requireAppAccess("kyc");
  const { status: statusParam, sort } = await props.searchParams;

  const status = TABS.some((t) => t.status === statusParam)
    ? (statusParam as KycStatus)
    : KycStatus.pending;
  const sortDir: Prisma.SortOrder = sort === "asc" ? "asc" : "desc";

  const [apps, counts] = await Promise.all([
    prisma.kycApplication.findMany({
      where: { status },
      orderBy: { riskScore: sortDir },
    }),
    prisma.kycApplication.groupBy({ by: ["status"], _count: true }),
  ]);

  const countFor = (s: KycStatus) =>
    counts.find((c) => c.status === s)?._count ?? 0;

  const nextSort = sortDir === "desc" ? "asc" : "desc";

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">KYC Review Queue</h1>
      <p className="mt-1 text-sm text-slate-500">
        Review customer identity verification cases and record decisions.
      </p>

      <div className="mt-5 flex gap-1 border-b border-slate-200">
        {TABS.map((tab) => {
          const active = tab.status === status;
          return (
            <Link
              key={tab.status}
              href={`/kyc?status=${tab.status}&sort=${sortDir}`}
              className={[
                "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition",
                active
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700",
              ].join(" ")}
            >
              {tab.label}
              <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                {countFor(tab.status)}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Applicant</th>
              <th className="px-4 py-2 font-medium">Country</th>
              <th className="px-4 py-2 font-medium">
                <Link
                  href={`/kyc?status=${status}&sort=${nextSort}`}
                  className="inline-flex items-center gap-1 hover:text-slate-800"
                >
                  Risk {sortDir === "desc" ? "▼" : "▲"}
                </Link>
              </th>
              <th className="px-4 py-2 font-medium">Flags</th>
              <th className="px-4 py-2 font-medium">Submitted</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {apps.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No applications in this status.
                </td>
              </tr>
            )}
            {apps.map((app) => {
              const flags = parseFlags(app.riskFlags);
              return (
                <tr key={app.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/kyc/${app.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {app.applicantName}
                    </Link>
                    <div className="text-xs text-slate-400">{app.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{app.country}</td>
                  <td className="px-4 py-3">
                    <RiskScoreBadge score={app.riskScore} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {flags.length === 0 ? (
                        <span className="text-xs text-slate-400">None</span>
                      ) : (
                        flags.map((f) => <RiskFlagBadge key={f} flag={f} />)
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                    {formatDateTime(app.submittedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <KycStatusBadge status={app.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
