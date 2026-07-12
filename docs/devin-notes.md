Devin Spec: Internal Tools Prototype (Retool Alternative Evaluation)

Context

You are building a prototype for a Series C fintech (~60 engineers) evaluating whether to replace Retool with an in-house internal-tools platform. This is a 2-hour proof of concept, not a production system. The goal is to demonstrate (a) how quickly core internal-tool functionality can be built, and (b) that a shared governance layer — auth, roles, audit logging — can be reused across multiple internal apps.

Prioritize a working, demoable happy path over completeness. When in doubt, choose the simpler implementation.

Stack (do not deviate)


Next.js (App Router) + TypeScript
SQLite via Prisma (zero-setup local run)
Tailwind for styling — clean and minimal, no component library needed
No real authentication provider. Use a simple session cookie set by a "login as..." user picker.


Architecture requirement (most important)

Build this as one platform with two apps inside it, not two standalone apps:


A shared app shell: layout, nav, session handling, role checks, and an audit-logging helper.
Individual tools (KYC queue, refunds dashboard) that plug into that shell.


Every state-changing action in ANY tool must go through a single shared auditedAction() helper that writes to an append-only AuditLog table: who, what action, which entity, before/after state (JSON), timestamp. This is the centerpiece of the demo — a fintech client cares about this more than the UI.

Data model


User: id, name, email, role (admin | kyc_reviewer | support_agent)
KycApplication: id, applicantName, email, country, riskScore (0–100), riskFlags (JSON array of strings, e.g. "PEP match", "Document mismatch", "Sanctions list near-match"), status (pending | approved | rejected | escalated), submittedAt, decidedAt, decidedById, decisionReason
RefundRequest: id, customerName, amountCents, currency, reason, status (pending | approved | denied), createdAt, decidedAt, decidedById
AuditLog: id, actorId, action, entityType, entityId, before (JSON), after (JSON), reason, createdAt


Seed the database with: 3 users (one per role), ~25 KYC applications in varied statuses with realistic-looking fake data and varied risk flags, ~10 refund requests. Seed data must make the demo look real — no "test1", "test2".

Milestone 1 (~40 min): Shell + governance layer


Login page: pick a user from the seeded three, sets session cookie. Show current user + role in the header, with a switch-user option.
Role-based access: admin sees everything; kyc_reviewer sees only the KYC app; support_agent sees only Refunds. Enforce on the server, not just in the nav.
auditedAction() helper wired into the data layer.
Admin-only Audit Log viewer: reverse-chronological table, filter by actor and entity type, expandable before/after diff.


STOP after Milestone 1 and report before continuing.

Milestone 2 (~50 min): KYC Review Queue (build fully)


Queue view: table of applications with status filter tabs (Pending / Escalated / Approved / Rejected), sortable by risk score, risk flags shown as badges, color-coded risk (green <40, yellow 40–70, red >70).
Detail view: applicant info, risk flags, document placeholder section (grey boxes labeled "Passport", "Proof of Address" — no real files), and a decision panel.
Decision panel: Approve / Reject / Escalate buttons. Reject and Escalate REQUIRE a reason (free text, validated). Decisions update status, record decidedBy/decidedAt/reason, and write to the audit log.
Per-application history: show that application's audit entries on its detail page.
Only kyc_reviewer and admin can decide.


STOP after Milestone 2 and report before continuing.

Milestone 3 (~20 min): Refunds Dashboard (deliberately thin)


Single page: refund requests table, summary stat cards (pending count, total pending amount), Approve/Deny buttons with required reason on Deny.
Must reuse the shared shell, role checks, and auditedAction() with no modifications to the platform layer. The point of this milestone is proving the second app is cheap once the platform exists — keep it minimal.


Non-goals (do not build)


Real auth, SSO, or password handling
Feature-flag admin panel
File upload, real document handling, or KYC-provider integrations
Deployment config, tests, CI
Pagination, search, or anything beyond what's specified


README requirements

Write a README covering: what this is (one paragraph, framed as a Retool-alternative prototype), how to run it (npm install, seed, npm run dev), the three seeded users and what each can see, and a short "what's intentionally missing" section (real auth, granular permissions, SOC 2 controls, etc.).

Working style


Commit at the end of each milestone with a clear message.
If anything in this spec is ambiguous, make the simplest reasonable choice and note it — do not block on questions.
If running behind, cut Milestone 3 before cutting audit logging or the decision-reason requirement.
