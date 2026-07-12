import { requireAppAccess } from "@/lib/session";

export default async function RefundsPlaceholderPage() {
  await requireAppAccess("refunds");
  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Refunds Dashboard</h1>
      <p className="mt-2 text-sm text-slate-500">Built in Milestone 3.</p>
    </div>
  );
}
