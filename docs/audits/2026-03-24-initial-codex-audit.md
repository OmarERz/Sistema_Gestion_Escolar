# Initial Codex Audit - 2026-03-24

## Metadata

- audit date: 2026-03-24
- tool: Codex
- model: GPT-5 Codex
- effort level: xhigh
- audit scope: Consistency review of `docs/implementation-plan.md`, `docs/Architecture.md`, `docs/data-models.md`, and the current backend/frontend codebase, with focus on payments, debt, recurring rules, withdrawals, reenrollment, and scholarships.
- reviewed docs: `docs/implementation-plan.md`, `docs/Architecture.md`, `docs/data-models.md`
- current status: Initial audit completed. Findings are normalized here as an audit register. All items remain open.

## Executive Summary

The repository is functionally advanced, but the highest-risk issues are not missing modules. The main risks are workflow bypasses, missing invariants between related entities, and documentation that no longer matches the implemented behavior.

The most urgent items are the withdrawal workflow bypass, missing cycle-alignment validation, and silent enrollment payment-generation failures. Reenrollment, recurring rules, and payment status handling are implemented end to end, but several rules remain underdefined or only partially enforced.

The docs are useful but not fully synchronized with the current repository state. Some drift is simple staleness. Some drift points to unresolved product or architecture decisions that should be settled before new feature work continues.

## Findings Table

| ID | Title | Type | Severity | Status | Affected Files / Areas | Docs Update Needed |
| --- | --- | --- | --- | --- | --- | --- |
| AUD-001 | Withdrawal workflow can be bypassed through generic student updates | Validation gap | Critical | Open | `backend/src/schemas/student.schema.ts`, `backend/src/services/student.service.ts` | No |
| AUD-002 | Cross-cycle invariants are not enforced across students, payments, and reenrollment | Validation gap | Critical | Open | `backend/src/services/student.service.ts`, `backend/src/services/payment.service.ts`, `backend/src/services/withdrawal.service.ts`, `frontend/src/pages/payments/PaymentForm.tsx` | No |
| AUD-003 | Academic history cannot safely represent same-cycle withdrawal and reenrollment | Architecture / Product decision | High | Open | `backend/prisma/schema.prisma`, `backend/src/services/withdrawal.service.ts` | Yes |
| AUD-004 | Withdrawal history does not expose reliable current vs historical state | Technical debt | High | Open | `backend/src/services/withdrawal.service.ts`, `frontend/src/pages/withdrawals/WithdrawalHistory.tsx` | Yes |
| AUD-005 | Recurring rule validation is underconstrained | Validation gap | High | Open | `backend/prisma/schema.prisma`, `backend/src/services/recurringRule.service.ts`, `frontend/src/pages/settings/RecurringRulesManagement.tsx` | Yes |
| AUD-006 | Payment status date logic is ambiguous and may be wrong on due dates | Code bug | High | Open | `backend/src/services/debt.service.ts`, payment status docs | Yes |
| AUD-007 | Enrollment payment-generation failures are silently swallowed | Technical debt | High | Open | `backend/src/services/student.service.ts`, enrollment/payment generation flow | No |
| AUD-008 | Reenrollment guardian management is lossy | Architecture / Product decision | High | Open | `backend/src/schemas/withdrawal.schema.ts`, `backend/src/services/withdrawal.service.ts`, `frontend/src/pages/withdrawals/Reenrollment.tsx` | Yes |
| AUD-009 | Payment update API exposes manual status changes that do not persist | Validation gap | Low | Open | `backend/src/schemas/payment.schema.ts`, `backend/src/services/payment.service.ts` | Yes |
| AUD-010 | Academic history is skipped for ungrouped enrollments | Architecture / Product decision | Medium | Open | `backend/src/services/student.service.ts`, `docs/data-models.md` | Yes |
| AUD-011 | Project documentation is materially out of sync with the repository state | Documentation drift | Medium | Open | `docs/implementation-plan.md`, `docs/Architecture.md`, `docs/data-models.md` | Yes |

## Detailed Findings

### AUD-001  Withdrawal workflow can be bypassed through generic student updates
- Type: Validation gap
- Severity: Critical
- Status: Open
- Affected files / areas: `backend/src/schemas/student.schema.ts`, `backend/src/services/student.service.ts`
- Issue: The generic student update path still allows `status='withdrawn'`. That permits a direct state change without creating a withdrawal record or capturing the debt snapshot.
- Why it matters: This breaks the documented withdrawal workflow and can leave repository state inconsistent across students, withdrawals, debt snapshots, and UI history.
- Recommended fix: Remove `withdrawn` from the generic student update schema and enforce withdrawal transitions only through `/api/withdrawals`.
- Docs update needed: No
- Notes / uncertainty: This finding is direct and low-uncertainty. The docs already describe the intended workflow clearly.

### AUD-002  Cross-cycle invariants are not enforced across students, payments, and reenrollment
- Type: Validation gap
- Severity: Critical
- Status: Open
- Affected files / areas: `backend/src/services/student.service.ts`, `backend/src/services/payment.service.ts`, `backend/src/services/withdrawal.service.ts`, `frontend/src/pages/payments/PaymentForm.tsx`
- Issue: Related entities are validated for existence, but not for business alignment. A student can be assigned to a group from another cycle, reenrollment can pair an unrelated group and cycle, and payments can be created in a cycle different from the student's cycle.
- Why it matters: This creates structurally valid but semantically inconsistent data. It directly affects academic placement, recurring generation, debt reporting, and future migrations.
- Recommended fix: Add server-side invariants for cycle alignment. Where possible, derive the cycle from the canonical entity instead of trusting independent input fields.
- Docs update needed: No
- Notes / uncertainty: If cross-cycle backfill is intentionally allowed for admin use, that should be modeled as an explicit exception instead of the default behavior.

### AUD-003  Academic history cannot safely represent same-cycle withdrawal and reenrollment
- Type: Architecture / Product decision
- Severity: High
- Status: Open
- Affected files / areas: `backend/prisma/schema.prisma`, `backend/src/services/withdrawal.service.ts`
- Issue: Academic history is unique per student and school cycle, but reenrollment logic attempts to record both `withdrawn` and `reenrolled`. In a same-cycle reenrollment case, one event will overwrite the other.
- Why it matters: The current model cannot preserve the full event history promised by the reenrollment flow when the student returns in the same cycle.
- Recommended fix: Decide whether same-cycle reenrollment is valid. If it is valid, support multiple academic-history events per cycle. If it is not valid, block it explicitly.
- Docs update needed: Yes
- Notes / uncertainty: The overwrite risk is real if same-cycle reenrollment remains allowed. The correct fix depends on product rules.

### AUD-004  Withdrawal history does not expose reliable current vs historical state
- Type: Technical debt
- Severity: High
- Status: Open
- Affected files / areas: `backend/src/services/withdrawal.service.ts`, `frontend/src/pages/withdrawals/WithdrawalHistory.tsx`
- Issue: Reenrollment preserves withdrawal records, but the API response does not distinguish current withdrawals from archival ones. The history page still presents operational actions on every row. It also renders the student's current group rather than a clear withdrawal-time snapshot.
- Why it matters: The history view is no longer a reliable operational queue once reenrollment is used. Users can be shown actions that will fail, and historical context can become misleading.
- Recommended fix: Expose `student.status` or an explicit `isCurrent` flag in withdrawal responses, hide actions for archival rows, and preserve or derive withdrawal-time group context.
- Docs update needed: Yes
- Notes / uncertainty: The exact UI/API shape depends on whether `Historial de Bajas` is meant to be an archive, an operational list, or both.

### AUD-005  Recurring rule validation is underconstrained
- Type: Validation gap
- Severity: High
- Status: Open
- Affected files / areas: `backend/prisma/schema.prisma`, `backend/src/services/recurringRule.service.ts`, `frontend/src/pages/settings/RecurringRulesManagement.tsx`
- Issue: Recurring rules do not enforce a unique rule per concept and cycle. The current flow also does not clearly restrict rules to concepts that make sense for recurring generation.
- Why it matters: Duplicate or semantically invalid rules can produce unintended payment generation and debt behavior. This is especially risky in finance workflows because the failure mode is extra or mis-timed charges.
- Recommended fix: Add a uniqueness guard for concept plus cycle, and define concept eligibility explicitly. If one-time concepts need a separate override mechanism, model that separately from recurring rules.
- Docs update needed: Yes
- Notes / uncertainty: The docs do not fully resolve whether one-time concepts are intentionally supported here. That should be decided before tightening validation.

### AUD-006  Payment status date logic is ambiguous and may be wrong on due dates
- Type: Code bug
- Severity: High
- Status: Open
- Affected files / areas: `backend/src/services/debt.service.ts`, payment status logic in `docs/implementation-plan.md`, payment status rules in `docs/data-models.md`
- Issue: Payment status uses a full timestamp comparison for overdue evaluation. With date-only due dates, that can mark payments overdue too early on the due date itself. The docs also do not fully align on whether a past-due partial payment should be `partial` or `overdue`.
- Why it matters: Payment status drives debt views, overdue workflows, and user interpretation of payment state. Incorrect timing or inconsistent semantics will create follow-on confusion.
- Recommended fix: Normalize due-date comparison to calendar dates and explicitly define the canonical precedence between `partial` and `overdue`.
- Docs update needed: Yes
- Notes / uncertainty: The date-normalization fix is straightforward. The final status precedence needs an explicit rule decision.

### AUD-007  Enrollment payment-generation failures are silently swallowed
- Type: Technical debt
- Severity: High
- Status: Open
- Affected files / areas: `backend/src/services/student.service.ts`, enrollment/payment generation flow
- Issue: Student creation triggers mandatory payment generation after the main transaction, but failures are caught and ignored.
- Why it matters: A student can be created successfully without the expected financial records, and the operator receives no warning. That undermines the integrity of enrollment and debt state.
- Recommended fix: Stop swallowing the failure. Either fail the request, or return a clear partial-success result with logging and a remediation path.
- Docs update needed: No
- Notes / uncertainty: This is low-uncertainty. The only open question is the preferred operator experience when generation fails.

### AUD-008  Reenrollment guardian management is lossy
- Type: Architecture / Product decision
- Severity: High
- Status: Open
- Affected files / areas: `backend/src/schemas/withdrawal.schema.ts`, `backend/src/services/withdrawal.service.ts`, `frontend/src/pages/withdrawals/Reenrollment.tsx`
- Issue: Reenrollment can only add existing guardians by ID. Added links are forced to a generic relationship and non-primary state. The flow does not support creating a new guardian or capturing relationship and primary semantics for added guardians.
- Why it matters: Guardian data becomes less precise during a core reenrollment workflow, even though the rest of the student/guardian model is more expressive.
- Recommended fix: Decide whether reenrollment should support full guardian creation and edit controls. At minimum, capture relationship and primary state for added links.
- Docs update needed: Yes
- Notes / uncertainty: The current docs imply richer guardian handling, but the intended scope of reenrollment guardian edits should be confirmed.

### AUD-009  Payment update API exposes manual status changes that do not persist
- Type: Validation gap
- Severity: Low
- Status: Open
- Affected files / areas: `backend/src/schemas/payment.schema.ts`, `backend/src/services/payment.service.ts`
- Issue: The payment update schema accepts `status`, but the service recalculates status immediately afterward. The manual value is therefore misleading or non-functional.
- Why it matters: This is a confusing API contract for both humans and future agents. It also increases the chance of writing client code that appears valid but has no durable effect.
- Recommended fix: Remove `status` from generic payment updates, or move all status changes into explicit dedicated actions.
- Docs update needed: Yes
- Notes / uncertainty: Low uncertainty. This is mainly an API-surface cleanup item.

### AUD-010  Academic history is skipped for ungrouped enrollments
- Type: Architecture / Product decision
- Severity: Medium
- Status: Open
- Affected files / areas: `backend/src/services/student.service.ts`, `docs/data-models.md`
- Issue: Academic history is only created on enrollment when a group is present. The docs, however, describe academic history in a way that implies one record per student and cycle.
- Why it matters: A student enrolled without a group can have incomplete academic history, which affects later historical reasoning and future automation.
- Recommended fix: Decide whether academic history should start at enrollment regardless of group assignment. Then align schema, service logic, and docs.
- Docs update needed: Yes
- Notes / uncertainty: This may be acceptable if the product intentionally treats group assignment as the start of academic history. That rule is not currently explicit.

### AUD-011  Project documentation is materially out of sync with the repository state
- Type: Documentation drift
- Severity: Medium
- Status: Open
- Affected files / areas: `docs/implementation-plan.md`, `docs/Architecture.md`, `docs/data-models.md`
- Issue: The reviewed docs disagree with each other and with the codebase on several points: withdrawal cardinality, table counts, dashboard/report status, payment generation timing at enrollment, payment history filtering, and tooling/test readiness.
- Why it matters: The docs are meant to act as implementation context. When they diverge materially, future coding work starts from conflicting assumptions.
- Recommended fix: Update the docs after resolving the product and architecture decisions referenced by AUD-003, AUD-005, AUD-006, and AUD-010. Use one document as the canonical operational state if possible.
- Docs update needed: Yes
- Notes / uncertainty: Some drift is simple staleness. Some drift is a symptom of unresolved decisions rather than missing edits.

## Recommended Fix Order

### Fix now

1. `AUD-001` — block withdrawal bypass through generic student updates.
2. `AUD-002` — enforce cycle invariants across students, payments, and reenrollment.
3. `AUD-007` — stop swallowing enrollment payment-generation failures.
4. `AUD-009` — clean up the misleading payment-update status surface.

### Validate first

1. `AUD-006` — confirm the intended `partial` vs `overdue` semantics, then normalize date handling.

### Product/architecture decision needed

1. `AUD-003` — decide whether same-cycle reenrollment is allowed and how academic history should represent it.
2. `AUD-004` — decide whether withdrawal history is archival, operational, or mixed.
3. `AUD-005` — define the exact scope and eligibility rules for recurring payment rules.
4. `AUD-008` — define the intended guardian-editing scope during reenrollment.
5. `AUD-010` — define whether ungrouped enrollment should still create academic history.

### Defer

1. `AUD-011` — update all reviewed docs after the decisions above are settled, so documentation is only rewritten once.

## Open Questions / Decisions

- Should same-cycle reenrollment be allowed? If yes, how should academic history preserve both withdrawal and reenrollment events in one cycle?
- Should `Historial de Bajas` behave as an archive, an operational list of current withdrawals, or both?
- Are recurring rules intended only for active monthly concepts, or is there a legitimate one-time concept use case that needs a different model?
- For a partially paid but past-due payment, should the canonical status be `partial` or `overdue`?
- Should reenrollment allow creating new guardians, or only linking existing ones? If linking only, should relationship and primary status still be editable in that flow?
- Should an enrolled student without a group still receive an academic-history entry for the cycle?
- Are any cross-cycle payment creation or backfill flows intentionally supported, or should cycle selection always be derived from the student context?

## Suggested Follow-up Areas

- Business-rule tests around status transitions, cycle invariants, reenrollment, and recurring generation.
- Validation hardening across service inputs, especially where related entities must stay aligned.
- API contract cleanup for misleading fields and for operational vs historical record visibility.
- Withdrawal and reenrollment history modeling, including snapshot strategy for historical fields.
- Documentation alignment process so `implementation-plan`, `Architecture`, and `data-models` stay synchronized over time.
