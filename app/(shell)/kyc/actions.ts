"use server";

import { KycStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auditedAction } from "@/lib/audit";
import { requireAppAccess } from "@/lib/session";
import { canDecideKyc } from "@/lib/rbac";

export type KycDecisionState = { error?: string; ok?: boolean };

const DECISIONS = {
  approve: { status: KycStatus.approved, requiresReason: false },
  reject: { status: KycStatus.rejected, requiresReason: true },
  escalate: { status: KycStatus.escalated, requiresReason: true },
} as const;

type Decision = keyof typeof DECISIONS;

export async function decideKyc(
  _prev: KycDecisionState,
  formData: FormData,
): Promise<KycDecisionState> {
  const user = await requireAppAccess("kyc");
  if (!canDecideKyc(user.role)) {
    return { error: "You are not authorized to decide KYC cases." };
  }

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "") as Decision;
  const reason = String(formData.get("reason") ?? "").trim();

  const config = DECISIONS[decision];
  if (!id || !config) return { error: "Invalid decision." };
  if (config.requiresReason && !reason) {
    return { error: `A reason is required to ${decision} an application.` };
  }

  const app = await prisma.kycApplication.findUnique({ where: { id } });
  if (!app) return { error: "Application not found." };

  await auditedAction({
    actorId: user.id,
    action: `kyc.${decision}`,
    entityType: "KycApplication",
    entityId: id,
    reason: reason || null,
    before: {
      status: app.status,
      decidedById: app.decidedById,
      decisionReason: app.decisionReason,
    },
    mutate: async (tx) => {
      const updated = await tx.kycApplication.update({
        where: { id },
        data: {
          status: config.status,
          decidedById: user.id,
          decidedAt: new Date(),
          decisionReason: reason || null,
        },
      });
      return {
        result: updated,
        after: {
          status: updated.status,
          decidedById: updated.decidedById,
          decisionReason: updated.decisionReason,
        },
      };
    },
  });

  revalidatePath(`/kyc/${id}`);
  revalidatePath("/kyc");
  return { ok: true };
}
