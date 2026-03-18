# Setup Guide — Sistema de Gestion Escolar

> **Maintenance note:** Update this guide when prerequisites change, new setup steps are added, or the development workflow changes.

## Prerequisites

| Tool | Version | Check command |
|------|---------|---------------|
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |
| MySQL | 8.x | `mysql --version` |
| Git | 2.x | `git --version` |

## 1. Clone and Install

```bash
git clone <repository-url>
cd sistema-de-gestion
npm install
```

This installs dependencies for both `backend/` and `frontend/` workspaces.

## 2. Configure MySQL

Create the database and user in MySQL:

```sql
CREATE DATABASE sistema_gestion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'gestion_admin'@'localhost' IDENTIFIED BY '<your-password>';
GRANT ALL PRIVILEGES ON sistema_gestion.* TO 'gestion_admin'@'localhost';
FLUSH PRIVILEGES;
```

## 3. Configure Environment Variables

Copy the example env file and update it with your credentials:

```bash
cp .env.example backend/.env
```

Edit `backend/.env` with your database credentials:

```
DATABASE_URL="mysql://gestion_admin:<your-password>@localhost:3306/sistema_gestion"
JWT_SECRET="<generate-a-random-secret>"
JWT_EXPIRES_IN="8h"
PORT=3000
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
```

## 4. Run Database Migrations

```bash
npm run db:migrate --workspace=backend
```

This creates all tables defined in `backend/prisma/schema.prisma`.

## 5. Seed the Database

```bash
npm run db:seed --workspace=backend
```

This inserts default data: admin user, payment concepts, sample school cycle, and groups.

## 6. Start Development Servers

```bash
npm run dev
```

This starts both servers concurrently:
- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173

To start them individually:

```bash
npm run dev:backend   # Backend only
npm run dev:frontend  # Frontend only
```

## 7. Run Tests

```bash
npm run test --workspace=backend
```

## 8. Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both servers |
| `npm run dev:backend` | Start backend only |
| `npm run dev:frontend` | Start frontend only |
| `npm run test --workspace=backend` | Run backend tests |
| `npm run db:migrate --workspace=backend` | Run Prisma migrations |
| `npm run db:seed --workspace=backend` | Seed the database |
| `npm run db:studio --workspace=backend` | Open Prisma Studio (DB browser) |

## 9. Project Structure

```
sistema-de-gestion/
├── CLAUDE.md                    # AI assistant conventions
├── package.json                 # npm workspaces root
├── .env.example                 # Environment variables template
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   ├── seed.ts              # Seed script
│   │   └── migrations/          # Migration history
│   └── src/
│       ├── index.ts             # Entry point
│       ├── app.ts               # Express config
│       ├── config/              # Environment, database config
│       ├── middleware/           # Auth, validation, error handling
│       ├── routes/              # Route definitions
│       ├── controllers/         # Request handlers
│       ├── services/            # Business logic
│       ├── schemas/             # Zod validation schemas
│       └── utils/               # Helpers (PDF, responses)
├── frontend/
│   └── src/
│       ├── main.tsx             # Entry point
│       ├── App.tsx              # Router + providers
│       ├── api/                 # Axios client + API functions
│       ├── hooks/               # React Query hooks
│       ├── pages/               # Page components
│       ├── components/          # Shared components
│       ├── types/               # TypeScript types
│       └── styles/              # MUI theme
└── docs/
    ├── implementation-plan.md   # Step-by-step build plan
    ├── Architecture.md          # Tech decisions + diagrams
    ├── data-models.md           # Database schema docs
    └── setup-guide.md           # This file
```

## Troubleshooting

### MySQL connection refused
Verify MySQL is running and the credentials in `backend/.env` match the user created in step 2.

### Port already in use
Change `PORT` in `backend/.env` or kill the process using the port:
```bash
# Find process on port 3000
npx kill-port 3000
```

### Prisma client out of sync
After pulling schema changes, regenerate the client:
```bash
npx prisma generate --schema=backend/prisma/schema.prisma
```
