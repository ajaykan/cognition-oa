"use client";

import { useActionState } from "react";
import { decideKyc, type KycDecisionState } from "./actions";

export function KycDecisionPanel({
  id,
  canDecide,
  decided,
}: {
  id: string;
  canDecide: boolean;
  decided: boolean;
}) {
  const [state, action, pending] = useActionState<KycDecisionState, FormData>(
    decideKyc,
    {},
  );

  if (!canDecide) {
    return (
      <p className="text-sm text-slate-500">
        Your role can view this case but cannot record a decision.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />

      <label className="block text-sm font-medium text-slate-700">
        Reason
        <textarea
          name="reason"
          rows={3}
          placeholder="Required to reject or escalate; optional to approve."
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          name="decision"
          value="approve"
          disabled={pending}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="submit"
          name="decision"
          value="reject"
          disabled={pending}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          Reject
        </button>
        <button
          type="submit"
          name="decision"
          value="escalate"
          disabled={pending}
          className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600 disabled:opacity-50"
        >
          Escalate
        </button>
      </div>

      {state.error && (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      )}
      {state.ok && (
        <p className="text-sm font-medium text-green-600">
          Decision recorded and written to the audit log.
        </p>
      )}
      {decided && !state.ok && !state.error && (
        <p className="text-xs text-slate-400">
          This case already has a decision. Recording a new one will update it and
          add another audit entry.
        </p>
      )}
    </form>
  );
}
