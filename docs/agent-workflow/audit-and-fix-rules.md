# Audit and Fix Rules

## Purpose
This document defines how Claude and Codex must work together for:
- repository audits
- finding classification
- fix ownership
- remediation batching
- prioritization
- decision handling
- handoff usage
- validation and follow-up rules

This file is specific to this repository and to these two agents:
- Claude Code
- Codex

## Core Agent Roles

### Claude Code
Claude is the primary agent for:
- planning
- implementation of medium/high-context changes
- business-rule clarification
- architecture or product decisions
- explaining technical changes in beginner-friendly language
- final integration of changes into the repository workflow

### Codex
Codex is the primary agent for:
- repository audits
- code review
- documentation review
- consistency review
- localized fixes with low ambiguity
- structural and technical feedback before and after manual testing
- proposing remediation batches based on audit findings

## Default Workflow

### Small changes
1. Claude implements or adjusts the change.
2. Codex performs a light review.
3. Manual validation is done if needed.
4. Claude finalizes and prepares commit context.

### Medium / large changes
1. Claude plans and implements the first version.
2. Codex performs an initial audit/review.
3. Manual testing is performed.
4. Feedback goes back to Claude.
5. Claude adjusts.
6. Codex performs a second review.
7. Repeat until the change is stable.
8. Claude finalizes the change and commit proposal.

## Required Audit Output Structure
Every audit document must contain these sections in this exact order:
1. Title
2. Metadata
3. Executive Summary
4. Findings Table
5. Detailed Findings
6. Recommended Fix Order
7. Open Questions / Decisions
8. Suggested Follow-up Areas

## Required Finding Fields
Every finding must include:
- ID
- Title
- Type
- Severity
- Status
- Affected Files / Areas
- Issue
- Why it matters
- Recommended fix
- Docs update needed
- Notes / uncertainty

## Allowed Finding Types
- Code bug
- Documentation drift
- Architecture / Product decision
- Technical debt
- Validation gap

## Allowed Severity Values
- Critical
- High
- Medium
- Low

## Allowed Status Values
- Open
- Needs validation
- Planned
- In progress
- Resolved
- Deferred

## Audit vs Remediation Batch

### Audit
The audit is the full inventory of findings discovered in a repository review.
It exists to:
- detect
- classify
- prioritize
- preserve uncertainty
- record drift, risks, and open questions

The audit includes all relevant findings, even if they are not immediately actionable.

### Remediation Batch
The remediation batch is the active work container.
It exists to:
- select findings from the audit
- organize them into active work
- assign ownership
- record decisions needed for implementation
- define validation expectations
- coordinate Claude and Codex around the current working scope

A remediation batch may include:
- findings ready to fix now
- findings that must be validated first
- findings that require an explicit decision before implementation
- findings intentionally deferred but tracked within the batch scope

## Agent Ownership Rules

### Codex should lead when:
- the issue is low-ambiguity
- the change is localized
- the fix does not require a new business-rule decision
- the main task is audit/review/consistency checking
- the issue is factual documentation drift
- the issue is a clear validation gap or API inconsistency

### Claude should lead when:
- the issue requires business-rule clarification
- the issue requires architecture/product decisions
- the change affects multiple layers with high context
- the change can alter system semantics
- the issue needs user-facing reasoning before implementation
- the problem is still ambiguous after audit

### Shared rule
Even when Codex leads a fix, Claude remains the main implementation/context agent for the repository workflow as a whole.

## Ownership Decision Matrix

| Finding type / condition | Default leader | Default reviewer | Handoff likely | Batch eligible now? |
|---|---|---|---|---|
| Clear localized code bug | Codex | Claude | Usually no | Usually yes |
| Clear validation gap | Codex | Claude | Sometimes | Usually yes |
| Factual documentation drift | Codex | Claude | Usually no | Usually yes |
| Localized technical debt | Codex | Claude | Sometimes | Usually yes |
| Cross-module technical debt | Claude | Codex | Usually yes | Sometimes |
| Architecture / Product decision | Claude | Codex | Usually yes | Yes, if active decision work is in scope |
| Ambiguous bug with business-rule impact | Claude | Codex | Usually yes | Only if decision/clarification is in scope |
| DB / Prisma sensitive change | Claude by default | Codex | Usually yes | Only after explicit approval |
| Cross-layer invariant change | Claude | Codex | Usually yes | Sometimes |

## Batch Eligibility Rules

### A finding is eligible for the next remediation batch when at least one is true:
- it is urgent enough to enter active work now
- it blocks or meaningfully slows future work
- it is clear enough to fix now
- it needs validation now
- it requires a decision that must be resolved in the current work cycle

### A finding should NOT enter the next remediation batch when any is true:
- it is too uncertain and not worth active work yet
- it is minor and non-blocking
- it is better handled after a larger related fix
- it does not belong to the current work scope
- it has no near-term value as active work

## Prioritization Rules

### Batch priority order
Within a remediation batch, findings should be organized into these lanes:

1. Fix now
2. Validate first
3. Decision needed
4. Defer

### Default priority heuristics
Prioritize first:
- Critical over High
- blockers over non-blockers
- clear and urgent fixes over ambiguous ones
- integrity/invariant issues over cosmetic cleanup
- findings with high technical debt impact if left unresolved

## Handoff Rules

### General rule
A handoff is not the main container.
The remediation batch is the main container.

### A handoff is required when at least one is true:
- the finding involves both agents across multiple steps
- the finding will continue across more than one session
- the finding requires an explicit decision before implementation
- the finding affects multiple modules or layers
- the finding has high risk or touches DB/Prisma
- the current agent must pass validated context to the next agent

### A handoff is usually NOT required when:
- the issue is tiny and localized
- the issue is a simple documentation correction
- the issue can be fixed and validated within one short session by one agent
- there is no important decision or uncertainty to preserve

### Storage rule
By default, handoffs should live inside the remediation batch as inline sections.
Create a standalone handoff file only when one finding becomes large enough to justify its own durable continuation.

## Remediation Batch Rules

### Primary container rule
Each audit may lead to zero, one, or multiple remediation batches.

### Batch usage
- Create a remediation batch when a subset of findings is ready or important enough for active work.
- Do NOT create one standalone file per small finding.
- Use one batch as the main working container for a group of related findings.
- Findings that require decisions may still enter the batch if they are part of the current active scope.

### Decision-needed findings in a batch
If a finding requires an architecture/product/business-rule decision and is part of the current work cycle:
- it may be included in the remediation batch
- the batch must contain an explicit decision section for that finding
- implementation must not start until the decision is recorded
- after the decision is made, the finding may move from `Decision needed` to `Fix now` or remain deferred

## DB / Prisma Special Rules

Before touching Prisma or the database, the acting agent must:
1. explain what it wants to do
2. explain why
3. identify affected files, models, tables, and flows
4. explain risks
5. propose one main option and at least one alternative
6. request explicit approval before sensitive DB changes

If a DB / Prisma approach fails 2 or more times:
1. stop
2. summarize the attempts
3. explain likely failure causes
4. research before trying again

### Research priority order
1. official Prisma documentation
2. official documentation of the related tool
3. other sources only if still unclear

## Validation Rules After Fixes

### For localized fixes
- validate the intended behavior manually
- verify the change did not break obvious adjacent behavior
- update docs only if the change affects documented behavior, structure, schema, or rules

### For medium / large fixes
- validate manually
- request Codex review
- identify follow-up tests
- document any remaining uncertainty explicitly

## Documentation Update Rules

### Claude should handle documentation updates when:
- the documentation change is directly tied to implementation just completed
- the update depends on reasoning about architecture or business rules

### Codex should handle documentation updates when:
- the drift is factual and already understood
- the task is to normalize, align, or audit docs against the current repo state

## General Quality Rules
- Prefer clarity over verbosity.
- Preserve uncertainty instead of overstating confidence.
- Do not invent problems to fill templates.
- Use stable finding IDs and consistent terminology.
- Keep documents easy for both humans and agents to scan.