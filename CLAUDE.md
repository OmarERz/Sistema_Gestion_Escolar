# CLAUDE.md — Sistema de Gestion Escolar

## Working Style

- Do not make any changes or start implementation until you have 95% confidence that you know what to build. Ask follow-up questions until you have that confidence level.
- Before creating any git commit, always present the proposed title and description to the user for approval. Only proceed with the commit after explicit approval of both.

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

### Pagination

- All backend list endpoints accept `?page=1&limit=20` (default limit: 20)
- Response format: `{ success, data, pagination: { page, limit, total, totalPages } }`
- All frontend tables use paginated queries with 20 rows per page as default

### Form Inputs

- All text inputs must include a `placeholder` with a sample value showing the expected format (e.g., `"ej. 2026-2027"`, `"ej. Juan Carlos"`, `"ej. 6141234567"`)

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
