# AGENTS.md — Sistema_Gestion_Escolar

## Purpose
This repository is a school management system (Phase 1).
For now, your primary role is NOT to implement major new features by default.
Your main role is to audit repository consistency and technical documentation quality.

## Project Context
Monorepo with npm workspaces:
- `backend/`: Express + TypeScript + Prisma + MySQL
- `frontend/`: React + TypeScript + Vite + MUI

## Current Working Agreement
Claude Code is the main implementation agent.
Codex is the main review/audit agent for medium and large changes, and a lighter reviewer for small changes.

## Priority for this first audit
Audit the current state of the repo before continuing with new feature work.

Main focus:
1. `docs/implementation-plan.md`
2. `docs/Architecture.md`
3. `docs/data-models.md`

Check whether these documents are still consistent with:
- current repository structure
- backend/frontend architecture
- implemented flows
- schema/model relationships
- business logic already present in code

## What to review
Focus especially on:
- structural consistency across modules
- drift between code and docs
- missing or outdated technical documentation
- duplicated or inconsistent implementation patterns
- payment, debt, recurring rules, withdrawal, reenrollment, scholarship-related logic
- areas that may create technical debt if left unchecked

## What NOT to do by default
- Do not make destructive database changes
- Do not reset the database
- Do not delete migrations
- Do not make large implementation changes unless explicitly requested
- Do not create new docs unless explicitly requested

## Database / Prisma rule
If reviewing a DB/Prisma-related issue:
- explain what seems wrong
- explain what change would be needed
- explain risks
- propose a main option and at least one alternative
- require explicit approval before sensitive DB changes

If a Prisma/DB approach fails 2 or more times:
- stop
- summarize attempts
- consult sources in this order:
  1. official Prisma docs
  2. official docs of the related tool
  3. other sources only if still unclear

## Output style for audits
Be concise, structured, and practical.
Prioritize actionable findings over long explanations.

For every issue found, classify it as:
- Critical
- Important
- Minor

When possible, indicate:
- affected files
- why it matters
- recommended fix
- whether documentation should change