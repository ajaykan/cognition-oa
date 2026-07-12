"use server";

import { RefundStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auditedAction } from "@/lib/audit";
import { requireAppAccess } from "@/lib/session";
import { canDecideRefund } from "@/lib/rbac";

export type RefundDecisionState = { error?: string; ok?: boolean };

const DECISIONS = {
  approve: { status: RefundStatus.approved, requiresReason: false },
  deny: { status: RefundStatus.denied, requiresReason: true },
} as const;

type Decision = keyof typeof DECISIONS;

export async function decideRefund(
  _prev: RefundDecisionState,
  formData: FormData,
): Promise<RefundDecisionState> {
  const user = await requireAppAccess("refunds");
  if (!canDecideRefund(user.role)) {
    return { error: "You are not authorized to decide refunds." };
  }

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "") as Decision;
  const reason = String(formData.get("reason") ?? "").trim();

  const config = DECISIONS[decision];
  if (!id || !config) return { error: "Invalid decision." };
  if (config.requiresReason && !reason) {
    return { error: "A reason is required to deny a refund." };
  }

  const refund = await prisma.refundRequest.findUnique({ where: { id } });
  if (!refund) return { error: "Refund request not found." };

  await auditedAction({
    actorId: user.id,
    action: `refund.${decision}`,
    entityType: "RefundRequest",
    entityId: id,
    reason: reason || null,
    before: { status: refund.status, decidedById: refund.decidedById },
    mutate: async (tx) => {
      const updated = await tx.refundRequest.update({
        where: { id },
        data: {
          status: config.status,
          decidedById: user.id,
          decidedAt: new Date(),
        },
      });
      return {
        result: updated,
        after: { status: updated.status, decidedById: updated.decidedById },
      };
    },
  });

  revalidatePath("/refunds");
  return { ok: true };
}
