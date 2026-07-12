# Architecture Overview — Internal Tools Prototype

**Context:** 2-hour Devin-built proof of concept evaluating an in-house replacement for Retool (KYC review queue + refunds dashboard) for a Series C fintech.

## System diagram

```
                        ┌─────────────────────────────────────────┐
                        │        Next.js (App Router, TS)         │
                        │                                         │
  Browser ──cookie──▶   │  ┌──────────── App Shell ────────────┐  │
  (session = user id)   │  │  layout / nav / session handling  │  │
                        │  │  requireAppAccess()  (lib/session)│  │
                        │  │  RBAC roles          (lib/rbac)   │  │
                        │  └──────┬─────────────────┬──────────┘  │
                        │         │                 │             │
                        │   ┌─────▼─────┐     ┌─────▼─────┐       │
                        │   │ KYC Queue │     │  Refunds  │  ...  │◀── future tools
                        │   │  (full)   │     │  (thin)   │       │    plug in here
                        │   └─────┬─────┘     └─────┬─────┘       │
                        │         │   server actions │            │
                        │         └────────┬─────────┘            │
                        │           ┌──────▼───────┐              │
                        │           │auditedAction()│  lib/audit  │
                        │           │ (transaction) │              │
                        │           └──────┬───────┘              │
                        └──────────────────┼──────────────────────┘
                                    ┌──────▼──────┐
                                    │   Prisma    │
                                    │   SQLite    │  User · KycApplication
                                    │             │  RefundRequest · AuditLog
                                    └─────────────┘
```

## Key decisions and tradeoffs

**1. One platform, two tools — not two apps.** The shell owns sessions, role checks, and audit logging; tools plug in. Rationale: Retool's replacement cost isn't the first app, it's the marginal cost of every app after it. The deliberately thin refunds dashboard exists to measure that marginal cost. Tradeoff: slightly more upfront structure than a single-page CRUD app.

**2. Audit log as a transactional chokepoint.** Every mutation flows through one `auditedAction()` helper that performs the write and appends the audit row (who / what / entity / before / after / reason / timestamp) in a single Prisma transaction. Rationale: for KYC and refunds, the audit trail *is* the product from a compliance standpoint; making it structurally unskippable beats relying on developer discipline. Tradeoff: an append-only table is not a tamper-proof log — production would need immutability guarantees (e.g., write-forwarding to WORM storage) and retention policy.

**3. RBAC enforced server-side, coarse-grained.** Three hard-coded roles checked in layouts and every server action; nav hiding is cosmetic only. Rationale: server enforcement is the minimum honest bar for a fintech demo. Tradeoff: no per-record ACLs, delegation, or approval chains — the exact area where Retool's mature permission model is hardest to replicate.

**4. Stubbed authentication.** A user-picker sets a session cookie; no identity provider. Rationale: SSO integration is well-understood, low-signal work for a prototype — the interesting questions were platform shape and audit design. This is the single largest gap between prototype and production.

**5. SQLite + `db push`, no migrations, `.env` committed (SQLite path only, no secrets).** Rationale: zero-setup reviewability — `npm install && npm run seed && npm run dev`. Tradeoff: none of it survives contact with production; Postgres + migration history is the obvious swap.

## What production would require

Real IdP/SSO, granular permissions, tamper-evident audit storage, PII handling and encryption at rest, safe production-DB access patterns (read replicas, query allowlisting), tests/CI, and an owner. The prototype demonstrates the UI and workflow layer is cheap to build with Devin; the governance and operational layer above is where the real cost — and the build-vs-buy question — lives.
