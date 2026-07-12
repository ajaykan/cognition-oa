import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAppAccess } from "@/lib/session";
import { canDecideKyc } from "@/lib/rbac";
import { formatDateTime } from "@/lib/format";
import {
  KycStatusBadge,
  RiskScoreBadge,
  RiskFlagBadge,
  RoleBadge,
} from "@/components/badges";
import { KycDecisionPanel } from "../decision-panel";

function parseFlags(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export default async function KycDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAppAccess("kyc");
  const { id } = await props.params;

  const app = await prisma.kycApplication.findUnique({
    where: { id },
    include: { decidedBy: true },
  });
  if (!app) notFound();

  const history = await prisma.auditLog.findMany({
    where: { entityType: "KycApplication", entityId: id },
    include: { actor: true },
    orderBy: { createdAt: "desc" },
  });

  const flags = parseFlags(app.riskFlags);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/kyc" className="text-sm text-blue-600 hover:underline">
          ← Back to queue
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {app.applicantName}
          </h1>
          <p className="text-sm text-slate-500">{app.email}</p>
        </div>
        <KycStatusBadge status={app.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Applicant + risk info */}
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">
              Applicant information
            </h2>
            <dl className="mt-3 grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-slate-500">Country</dt>
              <dd className="text-slate-900">{app.country}</dd>
              <dt className="text-slate-500">Risk score</dt>
              <dd>
                <RiskScoreBadge score={app.riskScore} />
              </dd>
              <dt className="text-slate-500">Submitted</dt>
              <dd className="text-slate-900">{formatDateTime(app.submittedAt)}</dd>
            </dl>
            <div className="mt-4">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Risk flags
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {flags.length === 0 ? (
                  <span className="text-sm text-slate-400">No flags raised.</span>
                ) : (
                  flags.map((f) => <RiskFlagBadge key={f} flag={f} />)
                )}
              </div>
            </div>
          </section>

          {/* Document placeholders */}
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Documents</h2>
            <div className="mt-3 grid grid-cols-2 gap-4">
              {["Passport", "Proof of Address"].map((label) => (
                <div
                  key={label}
                  className="flex h-32 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-100 text-sm text-slate-400"
                >
                  {label}
                </div>
              ))}
            </div>
          </section>

          {/* Per-application audit history */}
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">
              Decision history
            </h2>
            {history.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">
                No decisions recorded yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {history.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-start gap-3 border-l-2 border-slate-200 pl-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                          {entry.action}
                        </code>
                        <span className="text-sm text-slate-700">
                          {entry.actor.name}
                        </span>
                        <RoleBadge role={entry.actor.role} />
                      </div>
                      {entry.reason && (
                        <p className="mt-1 text-sm text-slate-600">
                          {entry.reason}
                        </p>
                      )}
                    </div>
                    <span className="whitespace-nowrap text-xs text-slate-400">
                      {formatDateTime(entry.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Decision panel */}
        <div className="lg:col-span-1">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Decision</h2>
            {app.decidedBy && (
              <p className="mt-1 mb-3 text-xs text-slate-500">
                Last decided by {app.decidedBy.name} on{" "}
                {formatDateTime(app.decidedAt)}.
              </p>
            )}
            <div className="mt-3">
              <KycDecisionPanel
                id={app.id}
                canDecide={canDecideKyc(user.role)}
                decided={app.status !== "pending"}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
