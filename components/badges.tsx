import { KycStatus, RefundStatus, Role } from "@prisma/client";
import { ROLE_LABELS } from "@/lib/rbac";

function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}

const ROLE_STYLES: Record<Role, string> = {
  admin: "bg-purple-100 text-purple-700",
  kyc_reviewer: "bg-blue-100 text-blue-700",
  support_agent: "bg-teal-100 text-teal-700",
};

export function RoleBadge({ role }: { role: Role }) {
  return <Pill className={ROLE_STYLES[role]}>{ROLE_LABELS[role]}</Pill>;
}

const KYC_STATUS_STYLES: Record<KycStatus, string> = {
  pending: "bg-slate-100 text-slate-600",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  escalated: "bg-amber-100 text-amber-700",
};

export function KycStatusBadge({ status }: { status: KycStatus }) {
  return <Pill className={KYC_STATUS_STYLES[status]}>{status}</Pill>;
}

const REFUND_STATUS_STYLES: Record<RefundStatus, string> = {
  pending: "bg-slate-100 text-slate-600",
  approved: "bg-green-100 text-green-700",
  denied: "bg-red-100 text-red-700",
};

export function RefundStatusBadge({ status }: { status: RefundStatus }) {
  return <Pill className={REFUND_STATUS_STYLES[status]}>{status}</Pill>;
}

// Risk score color coding: green <40, yellow 40-70, red >70.
export function riskTier(score: number): "low" | "medium" | "high" {
  if (score < 40) return "low";
  if (score <= 70) return "medium";
  return "high";
}

const RISK_STYLES: Record<"low" | "medium" | "high", string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-700",
};

export function RiskScoreBadge({ score }: { score: number }) {
  return <Pill className={RISK_STYLES[riskTier(score)]}>{score}</Pill>;
}

export function RiskFlagBadge({ flag }: { flag: string }) {
  return (
    <Pill className="bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200">
      {flag}
    </Pill>
  );
}
