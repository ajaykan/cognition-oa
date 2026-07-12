import { Role } from "@prisma/client";

export type AppId = "kyc" | "refunds" | "audit";

export type AppMeta = {
  id: AppId;
  name: string;
  href: string;
  description: string;
};

// The tools registered on the platform. Individual tools "plug in" here and the
// shell renders nav / access based on role.
export const APPS: Record<AppId, AppMeta> = {
  kyc: {
    id: "kyc",
    name: "KYC Review Queue",
    href: "/kyc",
    description: "Review and decide on customer identity verification cases.",
  },
  refunds: {
    id: "refunds",
    name: "Refunds Dashboard",
    href: "/refunds",
    description: "Approve or deny customer refund requests.",
  },
  audit: {
    id: "audit",
    name: "Audit Log",
    href: "/audit",
    description: "Append-only record of every state-changing action.",
  },
};

// Which apps each role can access. Enforced on the server, not just the nav.
const ACCESS: Record<Role, AppId[]> = {
  admin: ["kyc", "refunds", "audit"],
  kyc_reviewer: ["kyc"],
  support_agent: ["refunds"],
};

export function appsForRole(role: Role): AppMeta[] {
  return ACCESS[role].map((id) => APPS[id]);
}

export function canAccessApp(role: Role, appId: AppId): boolean {
  return ACCESS[role].includes(appId);
}

export function canDecideKyc(role: Role): boolean {
  return role === "admin" || role === "kyc_reviewer";
}

export function canDecideRefund(role: Role): boolean {
  return role === "admin" || role === "support_agent";
}

export function canViewAudit(role: Role): boolean {
  return role === "admin";
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  kyc_reviewer: "KYC Reviewer",
  support_agent: "Support Agent",
};
