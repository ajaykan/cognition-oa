import { PrismaClient, Role, KycStatus, RefundStatus } from "@prisma/client";

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(9 + (n % 8), (n * 7) % 60, 0, 0);
  return d;
}

async function main() {
  // Reset in dependency-safe order so `npm run seed` is idempotent.
  await prisma.auditLog.deleteMany();
  await prisma.kycApplication.deleteMany();
  await prisma.refundRequest.deleteMany();
  await prisma.user.deleteMany();

  const [admin, reviewer, agent] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Dana Whitfield",
        email: "dana.whitfield@acmebank.com",
        role: Role.admin,
      },
    }),
    prisma.user.create({
      data: {
        name: "Marcus Lundqvist",
        email: "marcus.lundqvist@acmebank.com",
        role: Role.kyc_reviewer,
      },
    }),
    prisma.user.create({
      data: {
        name: "Priya Nair",
        email: "priya.nair@acmebank.com",
        role: Role.support_agent,
      },
    }),
  ]);

  type KycSeed = {
    applicantName: string;
    email: string;
    country: string;
    riskScore: number;
    riskFlags: string[];
    status: KycStatus;
    submittedDaysAgo: number;
    decidedDaysAgo?: number;
    decisionReason?: string;
    decidedBy?: string;
  };

  const kyc: KycSeed[] = [
    { applicantName: "Sofia Bianchi", email: "sofia.bianchi@gmail.com", country: "Italy", riskScore: 12, riskFlags: [], status: KycStatus.approved, submittedDaysAgo: 21, decidedDaysAgo: 20, decisionReason: "Clean profile, documents verified.", decidedBy: reviewer.id },
    { applicantName: "James O'Connor", email: "james.oconnor@outlook.com", country: "Ireland", riskScore: 8, riskFlags: [], status: KycStatus.approved, submittedDaysAgo: 19, decidedDaysAgo: 18, decisionReason: "Low risk, auto-cleared after review.", decidedBy: reviewer.id },
    { applicantName: "Wei Chen", email: "wei.chen@proton.me", country: "Singapore", riskScore: 34, riskFlags: ["Document mismatch"], status: KycStatus.approved, submittedDaysAgo: 17, decidedDaysAgo: 15, decisionReason: "Address discrepancy resolved via utility bill.", decidedBy: admin.id },
    { applicantName: "Fatima Al-Sayed", email: "fatima.alsayed@gmail.com", country: "United Arab Emirates", riskScore: 58, riskFlags: ["PEP match"], status: KycStatus.escalated, submittedDaysAgo: 14, decidedDaysAgo: 13, decisionReason: "Possible PEP association — routed to compliance for EDD.", decidedBy: reviewer.id },
    { applicantName: "Diego Fernández", email: "diego.fernandez@gmail.com", country: "Argentina", riskScore: 72, riskFlags: ["Sanctions list near-match", "Document mismatch"], status: KycStatus.rejected, submittedDaysAgo: 13, decidedDaysAgo: 11, decisionReason: "Name closely matches OFAC entry; documents inconsistent.", decidedBy: admin.id },
    { applicantName: "Aisha Bello", email: "aisha.bello@yahoo.com", country: "Nigeria", riskScore: 66, riskFlags: ["High-risk jurisdiction"], status: KycStatus.escalated, submittedDaysAgo: 12, decidedDaysAgo: 10, decisionReason: "Source-of-funds documentation requested.", decidedBy: reviewer.id },
    { applicantName: "Lukas Müller", email: "lukas.mueller@web.de", country: "Germany", riskScore: 19, riskFlags: [], status: KycStatus.approved, submittedDaysAgo: 11, decidedDaysAgo: 10, decisionReason: "Standard verification passed.", decidedBy: reviewer.id },
    { applicantName: "Olga Petrova", email: "olga.petrova@mail.ru", country: "Russia", riskScore: 88, riskFlags: ["Sanctions list near-match", "High-risk jurisdiction", "PEP match"], status: KycStatus.rejected, submittedDaysAgo: 11, decidedDaysAgo: 9, decisionReason: "Sanctioned jurisdiction and PEP exposure — cannot onboard.", decidedBy: admin.id },
    { applicantName: "Carlos Mendoza", email: "carlos.mendoza@gmail.com", country: "Mexico", riskScore: 44, riskFlags: ["Document mismatch"], status: KycStatus.pending, submittedDaysAgo: 6 },
    { applicantName: "Hiroshi Tanaka", email: "h.tanaka@icloud.com", country: "Japan", riskScore: 15, riskFlags: [], status: KycStatus.pending, submittedDaysAgo: 6 },
    { applicantName: "Amara Okafor", email: "amara.okafor@gmail.com", country: "Nigeria", riskScore: 63, riskFlags: ["High-risk jurisdiction", "Document mismatch"], status: KycStatus.pending, submittedDaysAgo: 5 },
    { applicantName: "Emma Johansson", email: "emma.johansson@gmail.com", country: "Sweden", riskScore: 22, riskFlags: [], status: KycStatus.pending, submittedDaysAgo: 5 },
    { applicantName: "Mohammed Rahman", email: "m.rahman@outlook.com", country: "Bangladesh", riskScore: 51, riskFlags: ["PEP match"], status: KycStatus.pending, submittedDaysAgo: 5 },
    { applicantName: "Isabella Rossi", email: "isabella.rossi@gmail.com", country: "Italy", riskScore: 29, riskFlags: [], status: KycStatus.pending, submittedDaysAgo: 4 },
    { applicantName: "Viktor Ivanov", email: "viktor.ivanov@gmail.com", country: "Ukraine", riskScore: 77, riskFlags: ["Sanctions list near-match"], status: KycStatus.pending, submittedDaysAgo: 4 },
    { applicantName: "Grace Kim", email: "grace.kim@gmail.com", country: "South Korea", riskScore: 18, riskFlags: [], status: KycStatus.pending, submittedDaysAgo: 4 },
    { applicantName: "Thabo Nkosi", email: "thabo.nkosi@gmail.com", country: "South Africa", riskScore: 47, riskFlags: ["Document mismatch"], status: KycStatus.pending, submittedDaysAgo: 3 },
    { applicantName: "Chloé Dubois", email: "chloe.dubois@gmail.com", country: "France", riskScore: 31, riskFlags: [], status: KycStatus.pending, submittedDaysAgo: 3 },
    { applicantName: "Ahmed Hassan", email: "ahmed.hassan@gmail.com", country: "Egypt", riskScore: 69, riskFlags: ["High-risk jurisdiction", "PEP match"], status: KycStatus.pending, submittedDaysAgo: 3 },
    { applicantName: "Natalia Kowalski", email: "natalia.kowalski@gmail.com", country: "Poland", riskScore: 26, riskFlags: [], status: KycStatus.pending, submittedDaysAgo: 2 },
    { applicantName: "Samuel Adeyemi", email: "samuel.adeyemi@gmail.com", country: "Nigeria", riskScore: 82, riskFlags: ["Sanctions list near-match", "High-risk jurisdiction"], status: KycStatus.escalated, submittedDaysAgo: 8, decidedDaysAgo: 7, decisionReason: "Escalated for enhanced due diligence review.", decidedBy: reviewer.id },
    { applicantName: "Lucia Romano", email: "lucia.romano@gmail.com", country: "Italy", riskScore: 39, riskFlags: [], status: KycStatus.pending, submittedDaysAgo: 2 },
    { applicantName: "David Cohen", email: "david.cohen@gmail.com", country: "Israel", riskScore: 41, riskFlags: ["Document mismatch"], status: KycStatus.pending, submittedDaysAgo: 1 },
    { applicantName: "Fenteng Owusu", email: "fenteng.owusu@gmail.com", country: "Ghana", riskScore: 55, riskFlags: ["High-risk jurisdiction"], status: KycStatus.pending, submittedDaysAgo: 1 },
    { applicantName: "Maria Santos", email: "maria.santos@gmail.com", country: "Brazil", riskScore: 33, riskFlags: [], status: KycStatus.pending, submittedDaysAgo: 1 },
    { applicantName: "Ivan Horvat", email: "ivan.horvat@gmail.com", country: "Croatia", riskScore: 60, riskFlags: ["PEP match", "Document mismatch"], status: KycStatus.pending, submittedDaysAgo: 0 },
  ];

  for (const a of kyc) {
    const created = await prisma.kycApplication.create({
      data: {
        applicantName: a.applicantName,
        email: a.email,
        country: a.country,
        riskScore: a.riskScore,
        riskFlags: JSON.stringify(a.riskFlags),
        status: a.status,
        submittedAt: daysAgo(a.submittedDaysAgo),
        decidedAt: a.decidedDaysAgo != null ? daysAgo(a.decidedDaysAgo) : null,
        decidedById: a.decidedBy ?? null,
        decisionReason: a.decisionReason ?? null,
      },
    });

    // Record historical decisions in the audit log so the demo has history.
    if (a.status !== KycStatus.pending && a.decidedBy) {
      const action =
        a.status === KycStatus.approved
          ? "kyc.approve"
          : a.status === KycStatus.rejected
            ? "kyc.reject"
            : "kyc.escalate";
      await prisma.auditLog.create({
        data: {
          actorId: a.decidedBy,
          action,
          entityType: "KycApplication",
          entityId: created.id,
          before: JSON.stringify({ status: "pending" }),
          after: JSON.stringify({ status: a.status }),
          reason: a.decisionReason ?? null,
          createdAt: a.decidedDaysAgo != null ? daysAgo(a.decidedDaysAgo) : new Date(),
        },
      });
    }
  }

  type RefundSeed = {
    customerName: string;
    amountCents: number;
    currency: string;
    reason: string;
    status: RefundStatus;
    createdDaysAgo: number;
    decidedDaysAgo?: number;
    decidedBy?: string;
  };

  const refunds: RefundSeed[] = [
    { customerName: "Rebecca Turner", amountCents: 4999, currency: "USD", reason: "Duplicate subscription charge", status: RefundStatus.pending, createdDaysAgo: 3 },
    { customerName: "Kenji Watanabe", amountCents: 12900, currency: "USD", reason: "Service not delivered", status: RefundStatus.pending, createdDaysAgo: 2 },
    { customerName: "Sofia Bianchi", amountCents: 2500, currency: "EUR", reason: "Accidental purchase", status: RefundStatus.pending, createdDaysAgo: 2 },
    { customerName: "Marcus Webb", amountCents: 34999, currency: "USD", reason: "Chargeback dispute resolved in customer favor", status: RefundStatus.pending, createdDaysAgo: 1 },
    { customerName: "Aditya Sharma", amountCents: 7800, currency: "USD", reason: "Overcharged for annual plan", status: RefundStatus.pending, createdDaysAgo: 1 },
    { customerName: "Elena Popescu", amountCents: 1999, currency: "EUR", reason: "Cancelled within trial period", status: RefundStatus.approved, createdDaysAgo: 6, decidedDaysAgo: 5, decidedBy: agent.id },
    { customerName: "Tomás Silva", amountCents: 45000, currency: "USD", reason: "Billing error on enterprise invoice", status: RefundStatus.approved, createdDaysAgo: 8, decidedDaysAgo: 7, decidedBy: admin.id },
    { customerName: "Hannah Berg", amountCents: 999, currency: "USD", reason: "Requested refund after 90 days", status: RefundStatus.denied, createdDaysAgo: 9, decidedDaysAgo: 8, decidedBy: agent.id },
    { customerName: "Omar Farouk", amountCents: 15900, currency: "USD", reason: "Claims non-receipt, delivery confirmed", status: RefundStatus.denied, createdDaysAgo: 10, decidedDaysAgo: 9, decidedBy: agent.id },
    { customerName: "Julia Nowak", amountCents: 6250, currency: "USD", reason: "Feature not as described", status: RefundStatus.approved, createdDaysAgo: 5, decidedDaysAgo: 4, decidedBy: agent.id },
  ];

  for (const r of refunds) {
    const created = await prisma.refundRequest.create({
      data: {
        customerName: r.customerName,
        amountCents: r.amountCents,
        currency: r.currency,
        reason: r.reason,
        status: r.status,
        createdAt: daysAgo(r.createdDaysAgo),
        decidedAt: r.decidedDaysAgo != null ? daysAgo(r.decidedDaysAgo) : null,
        decidedById: r.decidedBy ?? null,
      },
    });

    if (r.status !== RefundStatus.pending && r.decidedBy) {
      await prisma.auditLog.create({
        data: {
          actorId: r.decidedBy,
          action: r.status === RefundStatus.approved ? "refund.approve" : "refund.deny",
          entityType: "RefundRequest",
          entityId: created.id,
          before: JSON.stringify({ status: "pending" }),
          after: JSON.stringify({ status: r.status }),
          reason: r.status === RefundStatus.denied ? "Outside refund policy window." : null,
          createdAt: r.decidedDaysAgo != null ? daysAgo(r.decidedDaysAgo) : new Date(),
        },
      });
    }
  }

  const [users, apps, refundCount, logs] = await Promise.all([
    prisma.user.count(),
    prisma.kycApplication.count(),
    prisma.refundRequest.count(),
    prisma.auditLog.count(),
  ]);
  console.log(
    `Seeded ${users} users, ${apps} KYC applications, ${refundCount} refund requests, ${logs} audit log entries.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
