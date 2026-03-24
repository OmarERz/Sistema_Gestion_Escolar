# Handoff Rules

## Purpose
This document defines when a handoff is needed, how handoffs relate to remediation batches, and how handoff documents or sections must be structured.

## Definition
A handoff is a structured context transfer between agents or between sessions.

A handoff is used to preserve:
- the problem being addressed
- decisions already made
- current implementation direction
- validation expectations
- unresolved blockers or uncertainty

## Relationship to Remediation Batches

### Primary rule
The remediation batch is the main container.

### Handoff rule
A handoff exists only when a specific finding or sub-task inside the batch needs durable continuity across:
- multiple agents
- multiple sessions
- explicit decisions
- sensitive or high-risk changes

## Default Recommendation
Do NOT create one handoff per small fix.

By default:
- use the audit document as the source of findings
- use one remediation batch as the working container
- create handoffs only for the subset of items that truly need them

## When a Handoff SHOULD be Created
Create a handoff when at least one is true:
- the next step depends on a decision already made
- the work will continue in another session
- Claude and Codex will both touch the same finding in sequence
- the change touches multiple layers or modules
- the change involves DB / Prisma
- the change is high-risk and needs a preserved validation plan
- the work is likely to be resumed later and would be costly to reconstruct

## When a Handoff SHOULD NOT be Created
Do not create a handoff when:
- the fix is tiny and self-contained
- the review comment is short-lived
- the issue can be solved by one agent in one session
- there is no important decision to preserve
- the remediation batch already contains enough context for the next step

## Handoff Ownership

### Claude should write or update a handoff when:
- the handoff depends on business-rule clarification
- the handoff is tied to a medium/large implementation plan
- the handoff needs beginner-friendly explanation of technical choices

### Codex should write or update a handoff when:
- the handoff comes from audit findings
- the handoff is primarily technical and review-oriented
- the handoff is meant to transfer a precise fix or risk assessment

## Handoff Quality Rules
A handoff must be:
- short
- explicit
- decision-aware
- validation-aware
- easy for another agent to continue without re-auditing from scratch

A handoff must NOT be:
- a full conversation dump
- a raw copy of all prior prompts
- a vague note without scope or validation
- a replacement for the remediation batch

## Storage Rules

### Default storage
Store real handoffs under:
- `docs/remediations/`

### Preferred pattern
Use the remediation batch as the primary document and include handoff sections inside it when possible.

### Standalone handoff files
Only create standalone handoff files when a single finding becomes large enough to deserve its own tracked continuation.

## Validation Requirements in a Handoff
Every handoff must preserve:
- what problem is being solved
- what decision already exists
- what files/areas are involved
- what still needs to happen
- how success will be checked
- what the next agent should do next

## DB / Prisma Handoff Rule
Any handoff involving DB / Prisma must also preserve:
- approved scope
- main option
- alternative considered
- explicit risk summary
- whether further online documentation lookup is required