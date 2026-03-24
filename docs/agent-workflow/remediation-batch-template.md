# Remediation Batch Template

## Batch Title
<Example: Batch 1 — Critical Fixes from Initial Codex Audit>

## Metadata
- Date:
- Source audit:
- Batch ID:
- Current status:
- Owner:
- Reviewer:

## Batch Goal
<What is this batch trying to accomplish?>

## Batch Scope
<Short explanation of why these findings were selected for active work now>

## Included Findings

| Finding ID | Title | Type | Severity | Lane | Leader | Reviewer | Handoff Needed | Status |
|---|---|---|---|---|---|---|---|---|
| AUD-001 | <title> | <type> | <severity> | Fix now | Claude/Codex | Claude/Codex | Yes/No | Open |

## Lane Overview

### Fix now
- <IDs>

### Validate first
- <IDs>

### Decision needed
- <IDs>

### Defer
- <IDs>

## Per-Finding Sections

### AUD-001 — <Title>
- Current classification:
- Current lane:
- Why this finding is in this batch:
- Agent leader:
- Agent reviewer:
- Handoff needed:
- Proposed implementation scope:
- Validation plan:
- Docs update needed:
- Notes:

## Decision Sections (only for findings in `Decision needed`)

### Decision for AUD-XXX — <Title>
- Decision question:
- Why this decision is needed:
- Options considered:
  - Option A:
  - Option B:
- Chosen decision:
- Decision rationale:
- Decision status:
- Decision owner:
- Reviewer:
- Impacted files / areas:
- Implementation unlocked:
- Notes / uncertainty:

## Inline Handoffs (only when needed)

### Handoff for AUD-XXX
- Current owner:
- Next owner:
- Context:
- Decision already made:
- Current understanding:
- Proposed direction:
- Main option:
- Alternative:
- Risks:
- Validation:
- Next action:

## Batch Validation Summary
- manual checks to run:
- Codex review required:
- tests to add later:
- docs to align later:

## Open Blockers
- <blocker 1>
- <blocker 2>

## Next Recommended Action
<What should happen after this batch?>


## Remediation Batch Naming Rules

Batch files must use this naming pattern:
`docs/remediations/YYYY-MM-DD-batch-N-short-name.md`

Where:
- `YYYY-MM-DD` = source audit date
- `N` = sequential batch number derived from that audit
- `short-name` = concise scope label in kebab-case

Examples:
- `docs/remediations/2026-03-24-batch-1-critical-fixes.md`
- `docs/remediations/2026-03-24-batch-2-payments-followup.md`
- `docs/remediations/2026-03-24-batch-3-doc-alignment.md`