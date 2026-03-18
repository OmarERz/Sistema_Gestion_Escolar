# CLAUDE.md — Sistema de Gestion Escolar

## Project Overview

School management system (Phase 1). Monorepo with npm workspaces: `backend/` (Express + TypeScript + Prisma + MySQL) and `frontend/` (React + TypeScript + Vite + MUI).

## Commands

- `npm run dev` — Start both backend (:3000) and frontend (:5173)
- `npm run dev:backend` — Backend only
- `npm run dev:frontend` — Frontend only
- `npm run test --workspace=backend` — Run Vitest tests

## Code Conventions

- **Language**: Spanish UI labels, English code/variables/comments
- **Backend pattern**: Routes → Controllers → Services → Prisma
- **Frontend pattern**: Pages → Hooks (React Query) → API client (Axios)

## Documentation Rules

### Code Comments

- Add `/** */` block at the top of every service and controller file describing its purpose
- Comment business logic that is not obvious from the function/variable name: formulas, edge cases, validation rules, non-trivial conditionals
- Do NOT add comments that restate what the code already says (e.g., `// increment counter` above `counter++`)
- Do NOT add JSDoc to every function — only where the signature alone is insufficient to understand behavior

### Documentation Files (docs/)

- Update `docs/implementation-plan.md` when: the plan changes, the tech stack changes, or a step is completed (mark with checkmark)
- Update `docs/Architecture.md` when: a new flow is added, the architecture changes, or a new technology is introduced
- Update `docs/data-models.md` when: the database schema changes (new tables, new columns, changed relationships)
- Do NOT create new documentation files unless explicitly requested
- Do NOT generate README files unless explicitly requested
