# Architecture Document — Sistema de Gestión Escolar

> **Maintenance note:** If the tech stack, architecture decisions, or deployment strategy change during development, update this document to reflect the current state.

## 1. Tech Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Frontend** | React 19 + TypeScript + Vite 8 | React is the most widely adopted UI library with a vast ecosystem. TypeScript adds compile-time safety. Vite provides fast dev server and optimized builds. |
| **UI Library** | Material UI (MUI) v7 | Mature component library with built-in Spanish locale support, DataGrid for tables, date pickers, and a theming system for consistent branding. |
| **Forms** | React Hook Form + Zod | React Hook Form is performant (minimal re-renders). Zod provides schema-based validation that can be shared conceptually with backend validation. |
| **Server State** | TanStack Query (React Query) | Handles API data fetching, caching, background refetching, and cache invalidation — ideal for CRUD-heavy applications. Eliminates the need for Redux. |
| **Backend** | Node.js + Express + TypeScript | Express is the most established Node.js framework. TypeScript ensures type safety across the full stack. Lightweight and flexible for a layered architecture. |
| **ORM** | Prisma | Type-safe database client auto-generated from schema. Declarative migration system. Excellent MySQL support and developer experience. |
| **Database** | MySQL 8 | Robust relational database well-suited for structured educational/financial data. Widely supported with excellent tooling. |
| **Validation** | Zod | Single validation library used on both frontend (forms) and backend (request validation). Schema-first approach with TypeScript inference. |
| **PDF Generation** | pdfkit | Programmatic PDF creation without HTML templating overhead. Zero native dependencies. Produces professional documents. |
| **Auth** | JWT (jsonwebtoken + bcryptjs) | Stateless authentication suitable for a single-admin Phase 1 setup. Simple to implement and extend later for multi-user support. |
| **Date Picker** | MUI x-date-pickers v8 + dayjs | Calendar popup for date inputs. AdapterDayjs with `es` locale provides Spanish month/day names. Used in StudentCreate, StudentDetail, and SchoolCycleManagement. |
| **Charts** | Recharts | Composable chart library built on React and D3. Simple API for bar, line, and pie charts needed in the dashboard. |
| **HTTP Client** | Axios | Feature-rich HTTP client with interceptors for JWT attachment and error handling. Better DX than native fetch for complex scenarios. |
| **Testing** | Vitest | Native test framework for Vite/TypeScript projects. Used for backend integration tests on critical business logic (debt calculation, payment formulas, recurring rules). |

---

## 2. Architecture Overview

The system follows a **layered architecture** (n-tier) with three distinct tiers and a clear separation of concerns.

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION TIER                         │
│                                                             │
│  Frontend (React SPA)           Backend (Express)           │
│  ┌─────────────────┐           ┌──────────────────┐        │
│  │ Pages & Components│          │ Routes            │        │
│  │ React Hook Form  │  HTTP    │ Controllers       │        │
│  │ TanStack Query   │ ──────► │ Middleware         │        │
│  │ MUI Components   │  JSON   │  (auth, validation)│        │
│  └─────────────────┘           └──────────────────┘        │
│                                         │                   │
├─────────────────────────────────────────┼───────────────────┤
│                    BUSINESS LOGIC TIER   │                   │
│                                         ▼                   │
│                                ┌──────────────────┐        │
│                                │ Services          │        │
│                                │  - Debt calc      │        │
│                                │  - Payment gen    │        │
│                                │  - PDF reports    │        │
│                                │  - Overdue check  │        │
│                                └──────────────────┘        │
│                                         │                   │
├─────────────────────────────────────────┼───────────────────┤
│                    DATA ACCESS TIER     │                   │
│                                         ▼                   │
│                                ┌──────────────────┐        │
│                                │ Prisma Client     │        │
│                                │ (Type-safe ORM)   │        │
│                                └──────────────────┘        │
│                                         │                   │
│                                         ▼                   │
│                                ┌──────────────────┐        │
│                                │ MySQL 8           │        │
│                                │ (15 tables)       │        │
│                                └──────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

**Layer responsibilities:**

| Layer | Components | Responsibility |
|-------|-----------|----------------|
| **Presentation** | Routes, Controllers, Middleware | Parse HTTP requests, authenticate, validate input, format responses. No business logic. |
| **Business Logic** | Services | All business rules: debt calculation, payment generation, withdrawal processing, PDF generation, overdue checks. |
| **Data Access** | Prisma Client | Type-safe database queries, migrations, seeding. Auto-generated from `schema.prisma`. |

### UI Conventions

- **Dark theme**: Navy palette (#0B0F1A background, #111827 paper, #29B6F6 cyan accent). Shadows over borders.
- **Server-side sorting**: All list endpoints accept `?sortBy=field&sortDir=asc|desc`. Sort is validated against an allowlist per endpoint, applied via Prisma `orderBy`, and works across all pages.
- **Pagination**: All list endpoints accept `?page=1&limit=20`. Default 20 rows per page.
- **Design principles**: Font smoothing (antialiased), tabular-nums on numbers, text-wrap balance on headings, scale-on-press (0.96) for buttons, min 40px hit areas.
- **`noGroup` filter**: List endpoints that reference groups accept `?noGroup=true` to return records with `groupId IS NULL`. Takes precedence over `groupId` param. Exposed in StudentList as "Sin grupo" option in the group dropdown.

---

## 3. Component Diagram

```mermaid
graph TB
    subgraph Frontend["Frontend (React SPA - Port 5173)"]
        direction TB
        Pages["Pages<br/>Dashboard, Students, Payments,<br/>Groups, Uniforms, Withdrawals,<br/>Settings"]
        Components["Components<br/>AppLayout, Sidebar, Header,<br/>DataTable, DebtBadge,<br/>ConfirmDialog, Forms"]
        Hooks["Hooks<br/>useStudents, usePayments,<br/>useGroups, useUniforms"]
        ApiClient["API Client<br/>Axios + JWT Interceptor"]
        State["State Management<br/>TanStack Query (server)<br/>React Context (auth)"]

        Pages --> Components
        Pages --> Hooks
        Hooks --> ApiClient
        Pages --> State
    end

    subgraph Backend["Backend (Express - Port 3000)"]
        direction TB
        Routes["Routes<br/>/api/students, /api/payments,<br/>/api/groups, /api/uniforms,<br/>/api/withdrawals, /api/reports"]
        Middleware["Middleware<br/>Auth (JWT), Validation (Zod),<br/>Error Handler, CORS, Helmet"]
        Controllers["Controllers<br/>student, payment, group,<br/>guardian, uniform, withdrawal,<br/>report, auth"]
        Services["Services<br/>student, payment, debt,<br/>guardian, group, uniform,<br/>withdrawal, report, auth,<br/>recurringPayment"]
        Schemas["Schemas (Zod)<br/>Request validation for<br/>all endpoints"]
        Utils["Utils<br/>pdfGenerator, apiResponse,<br/>logger"]

        Routes --> Middleware
        Middleware --> Controllers
        Controllers --> Services
        Controllers --> Schemas
        Services --> Utils
    end

    subgraph Database["Database (MySQL 8 - Port 3306)"]
        direction TB
        Prisma["Prisma Client<br/>(Auto-generated)"]
        Tables["15 Tables<br/>students, guardians, groups,<br/>payments, uniforms, withdrawals,<br/>school_cycles, fiscal_data, etc."]

        Prisma --> Tables
    end

    ApiClient -->|"HTTP/JSON<br/>REST API"| Routes
    Services --> Prisma
```

---

## 4. Main Flows

### 4.1 Student Enrollment Flow

```mermaid
sequenceDiagram
    actor Admin
    participant FE as Frontend
    participant API as Backend API
    participant SVC as Services
    participant DB as MySQL

    Admin->>FE: Fill student form<br/>(student data + guardians + fiscal)
    FE->>FE: Validate form (React Hook Form + Zod)

    Note over FE,API: Check guardian duplicates first
    FE->>API: GET /api/guardians/check-duplicate?email=...&phone=...
    API->>SVC: guardianService.checkDuplicate()
    SVC->>DB: Query guardians by email/phone
    DB-->>SVC: Results
    SVC-->>API: Duplicate status
    API-->>FE: { exists: true/false, guardian?: {...} }

    alt Guardian exists
        FE->>FE: Show existing guardian, allow linking
    end

    Admin->>FE: Submit enrollment
    FE->>API: POST /api/students (student + guardians data)
    API->>API: Validate request (Zod schema)
    API->>SVC: studentService.create()

    SVC->>DB: BEGIN TRANSACTION
    SVC->>DB: INSERT student
    SVC->>DB: INSERT/LINK guardians (up to 4)
    SVC->>DB: INSERT fiscal_data (if provided)
    SVC->>DB: INSERT student_academic_history
    SVC->>DB: COMMIT

    Note over SVC,DB: Auto-generate mandatory payments
    SVC->>SVC: paymentService.bulkGenerate()
    SVC->>DB: INSERT payments (inscription + 11 tuition + materials + insurance)
    SVC->>SVC: debtService.recalculate()
    SVC->>DB: UPDATE student.total_debt

    SVC-->>API: Created student with payments
    API-->>FE: 201 { success: true, data: student }
    FE->>FE: Show success notification
    FE->>FE: Navigate to student detail
```

### 4.2 Payment Registration Flow

```mermaid
sequenceDiagram
    actor Admin
    participant FE as Frontend
    participant API as Backend API
    participant SVC as Services
    participant DB as MySQL

    Admin->>FE: Navigate to /pagos
    Admin->>FE: Search and select student
    FE->>API: GET /api/students/:id/debt
    API->>SVC: debtService.getBreakdown()
    SVC->>DB: Query pending/partial payments
    DB-->>SVC: Payment records
    SVC-->>API: Debt breakdown by concept
    API-->>FE: { totalDebt, concepts: [...] }
    FE->>FE: Display current debt summary

    Admin->>FE: Select payment concept & month
    Admin->>FE: Enter discount/surcharge (optional)
    FE->>FE: Auto-calculate final amount<br/>final = base × (1 - discount%) × (1 + surcharge%)

    Admin->>FE: Confirm payment
    FE->>API: POST /api/payments
    API->>API: Validate request (Zod)
    API->>SVC: paymentService.register()

    SVC->>DB: BEGIN TRANSACTION
    SVC->>DB: UPDATE payment SET status='paid',<br/>amount_paid, payment_date, payment_method
    SVC->>SVC: debtService.recalculate(studentId)
    SVC->>DB: UPDATE student.total_debt
    SVC->>DB: COMMIT

    SVC-->>API: Updated payment
    API-->>FE: 200 { success: true, data: payment }
    FE->>FE: Show success notification
    FE->>FE: Refresh debt display
```

### 4.3 Student Withdrawal Flow

```mermaid
sequenceDiagram
    actor Admin
    participant FE as Frontend
    participant API as Backend API
    participant SVC as Services
    participant DB as MySQL

    Admin->>FE: Navigate to /bajas/nueva
    Admin->>FE: Search and select student
    FE->>API: GET /api/students/:id
    API-->>FE: Student details (including total_debt)
    FE->>FE: Display student info & current debt

    Admin->>FE: Enter withdrawal reason
    Admin->>FE: Click "Procesar Baja"
    FE->>FE: Show confirmation dialog<br/>"¿Está seguro? El adeudo pendiente<br/>de $X será registrado."

    Admin->>FE: Confirm withdrawal
    FE->>API: POST /api/withdrawals
    API->>API: Validate request (Zod)
    API->>SVC: withdrawalService.process()

    SVC->>DB: BEGIN TRANSACTION

    Note over SVC,DB: 1. Snapshot current debt
    SVC->>DB: SELECT total_debt FROM students WHERE id=:id
    SVC->>DB: INSERT withdrawal<br/>(student_id, reason, pending_debt_at_withdrawal, date)

    Note over SVC,DB: 2. Update student status
    SVC->>DB: UPDATE student SET status='withdrawn'

    Note over SVC,DB: 3. Preserve all history (NO deletes)
    SVC->>DB: COMMIT

    SVC-->>API: Withdrawal record
    API-->>FE: 201 { success: true, data: withdrawal }
    FE->>FE: Show success notification
    FE->>FE: Navigate to withdrawal history
```

### 4.4 Recurring Payment Generation Flow

```mermaid
sequenceDiagram
    participant APP as App Startup / Manual Trigger
    participant SVC as Recurring Payment Service
    participant DB as MySQL

    APP->>SVC: generateFromRules()

    SVC->>DB: SELECT active recurring_payment_rules<br/>WHERE current month BETWEEN start_month AND end_month
    DB-->>SVC: Active rules

    loop For each rule
        SVC->>SVC: Check: is today >= generation_day?
        SVC->>DB: SELECT active students in rule's school_cycle
        DB-->>SVC: Student list

        loop For each student
            SVC->>DB: Check: payment already exists for<br/>this concept + student + month?

            alt Payment does NOT exist
                SVC->>DB: INSERT payment<br/>(status: pending, due_date: rule.due_day,<br/>amount: rule.amount or concept.default_amount)
                SVC->>SVC: debtService.recalculate(studentId)
                SVC->>DB: UPDATE student.total_debt
            end
        end
    end

    Note over APP,DB: Also runs overdue check
    APP->>SVC: checkOverduePayments()
    SVC->>DB: UPDATE payments<br/>SET status='overdue'<br/>WHERE status='pending'<br/>AND due_date < CURRENT_DATE
```

---

## 5. Deployment Architecture

### Development Environment (Windows)

```mermaid
graph LR
    subgraph Windows["Windows Development Machine"]
        ViteDev["Vite Dev Server<br/>localhost:5173"]
        Express["Express Dev Server<br/>localhost:3000"]
        MySQL["Local MySQL 8<br/>localhost:3306"]

        ViteDev -->|"Proxy /api"| Express
        Express -->|"Prisma Client"| MySQL
    end
```

### Production Environment (macOS + Docker)

```mermaid
graph TB
    subgraph Docker["Docker Compose"]
        subgraph nginx_container["Frontend Container (nginx)"]
            Nginx["nginx<br/>Port 80"]
            StaticFiles["React Build<br/>(static files)"]
            Nginx --> StaticFiles
        end

        subgraph backend_container["Backend Container (Node.js)"]
            Express["Express Server<br/>Port 3000"]
        end

        subgraph db_container["Database Container (MySQL 8)"]
            MySQL["MySQL<br/>Port 3306"]
            Volume["Persistent Volume<br/>/var/lib/mysql"]
            MySQL --> Volume
        end

        Nginx -->|"Proxy /api/*"| Express
        Express -->|"Prisma Client"| MySQL
    end

    User["User Browser"] -->|"HTTP :80"| Nginx
```

### Docker Compose Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `frontend` | Custom (nginx + React build) | 80 → 80 | Serves SPA, proxies API requests |
| `backend` | Custom (Node.js) | 3000 (internal) | REST API server |
| `mysql` | mysql:8 | 3306 (internal) | Database with persistent volume |

**Key configuration:**
- Frontend nginx proxies `/api/*` requests to the backend container
- MySQL data persisted via Docker volume (survives container restarts)
- Environment variables injected via `.env` file
- Backend runs Prisma migrations on container startup
