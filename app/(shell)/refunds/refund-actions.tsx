"use client";

import { useActionState } from "react";
import { decideRefund, type RefundDecisionState } from "./actions";

export function RefundActions({ id }: { id: string }) {
  const [state, action, pending] = useActionState<RefundDecisionState, FormData>(
    decideRefund,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <input
        type="text"
        name="reason"
        placeholder="Reason (required to deny)"
        className="w-48 rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          name="decision"
          value="approve"
          disabled={pending}
          className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="submit"
          name="decision"
          value="deny"
          disabled={pending}
          className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          Deny
        </button>
      </div>
      {state.error && <p className="text-xs font-medium text-red-600">{state.error}</p>}
    </form>
  );
}
