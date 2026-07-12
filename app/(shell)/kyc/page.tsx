import { requireAppAccess } from "@/lib/session";

export default async function KycPlaceholderPage() {
  await requireAppAccess("kyc");
  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">KYC Review Queue</h1>
      <p className="mt-2 text-sm text-slate-500">Built in Milestone 2.</p>
    </div>
  );
}
