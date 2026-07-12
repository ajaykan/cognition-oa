import { Prisma } from "@prisma/client";
import { prisma } from "./db";

export type AuditedActionInput<T> = {
  /** Who is performing the action. */
  actorId: string;
  /** Machine-readable action name, e.g. "kyc.approve" or "refund.deny". */
  action: string;
  /** Entity kind, e.g. "KycApplication" or "RefundRequest". */
  entityType: string;
  /** Id of the affected entity. */
  entityId: string;
  /** Optional human reason (required by some actions at the call site). */
  reason?: string | null;
  /** Snapshot of the entity before the change. */
  before: unknown;
  /**
   * Performs the actual state change inside the same transaction as the audit
   * write, and returns the result plus the "after" snapshot to record.
   */
  mutate: (tx: Prisma.TransactionClient) => Promise<{ result: T; after: unknown }>;
};

/**
 * The single shared entry point for every state-changing action across ALL
 * tools on the platform. It performs the mutation and writes an append-only
 * AuditLog row in one atomic transaction, capturing who / what / which entity /
 * before + after / reason / when.
 *
 * No tool should mutate KYC or refund state without going through this helper.
 */
export async function auditedAction<T>(input: AuditedActionInput<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    const { result, after } = await input.mutate(tx);

    await tx.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        reason: input.reason ?? null,
        before: input.before === undefined ? null : JSON.stringify(input.before),
        after: after === undefined ? null : JSON.stringify(after),
      },
    });

    return result;
  });
}
