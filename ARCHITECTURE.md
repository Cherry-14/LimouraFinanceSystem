# Limoura Creative Studio — Financial Tracking & Analytics System

## Software Architecture & Planning Document

> A complete, production-grade architecture for an internal admin-only system that tracks revenue, expenses, project profitability, and generates downloadable analytics reports.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Folder Structure](#3-folder-structure)
4. [Database Schema](#4-database-schema)
5. [Entity Relationship Design](#5-entity-relationship-design)
6. [API Structure & Endpoints](#6-api-structure--endpoints)
7. [Backend Architecture (Laravel)](#7-backend-architecture-laravel)
8. [Frontend Architecture (Next.js)](#8-frontend-architecture-nextjs)
9. [Dashboard UI Structure](#9-dashboard-ui-structure)
10. [Analytics Module Design](#10-analytics-module-design)
11. [Suggested Charts & KPIs](#11-suggested-charts--kpis)
12. [Authentication Flow](#12-authentication-flow)
13. [PDF Export Architecture](#13-pdf-export-architecture)
14. [Recommended Packages & Libraries](#14-recommended-packages--libraries)
15. [Development Roadmap](#15-development-roadmap)
16. [MVP vs Future Features](#16-mvp-vs-future-features)
17. [Best Practices](#17-best-practices)
18. [Scalability Considerations](#18-scalability-considerations)
19. [Security Recommendations](#19-security-recommendations)
20. [Suggested UI Layouts](#20-suggested-ui-layouts)
21. [Database Optimizations](#21-database-optimizations)
22. [Naming Conventions](#22-naming-conventions)
23. [State Management](#23-state-management)
24. [Clean Coding Practices](#24-clean-coding-practices)

---

## 1. Executive Summary

### Purpose

A focused internal tool for **Limoura Creative Studio** — an Amazon creative services agency — to track financial performance across:

- **Revenue** from creative projects (Listing Images, A+ Content, Storefront Design, Video Editing, Branding, Infographics)
- **Operational expenses** (salaries, software subscriptions, freelancers, rent, marketing)
- **Project, client, and service profitability**
- **Trends, forecasts, and exportable reports**

### What this system is NOT

- Not a POS or e-commerce platform
- Not an accounting ERP (no double-entry ledger, no tax compliance modules)
- Not a CRM (no leads, pipelines, or client-facing features)
- Not an HR/payroll system
- Not a project management tool (no tasks, timelines, or Kanban)

### Core Principles

1. **Admin-only.** Single user role. No client portal, no employee accounts.
2. **Manual encoding.** All data entered by hand — no integrations to Stripe, QuickBooks, or banks.
3. **Insight-first.** Every screen serves the question: *is this profitable, and is it growing?*
4. **Speed of entry.** Forms optimized for keyboard flow and rapid manual capture.
5. **Audit trail.** Every mutation logged, soft deletes preserved.

---

## 2. System Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          BROWSER (Admin)                            │
│                                                                     │
│   Next.js App Router (React Server Components + Client Components)  │
│                                                                     │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐   │
│   │  Dashboard  │  │   Sales /   │  │  Analytics  │  │ Reports  │   │
│   │             │  │  Expenses   │  │             │  │  (PDF)   │   │
│   └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘   │
│                                                                     │
│   ── jsPDF / autoTable (client-side PDF generation) ──              │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │ HTTPS, JSON
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       API LAYER                                     │
│                                                                     │
│   Option A: Next.js Route Handlers (used in this repo)              │
│   Option B: Laravel API (scaffolded in /laravel-backend/)           │
│                                                                     │
│   - Cookie-based admin auth (HMAC-signed session token)             │
│   - Middleware: auth gate, request validation (Zod)                 │
│   - Services: SalesService, ExpenseService, AnalyticsService        │
│   - Repositories: PrismaClient / Eloquent models                    │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │ SQL
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DATABASE                                      │
│                                                                     │
│   PostgreSQL (production) — SQLite (local development)              │
│                                                                     │
│   Tables: clients, sales, expenses, audit_logs                      │
│   - Soft deletes via deleted_at                                     │
│   - Indexed on date, status, foreign keys                           │
│   - Money stored as integer cents                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Money representation | Integer cents | Avoids floating-point drift; standard practice in fintech |
| Soft deletes | `deletedAt` timestamp | Preserves historical reporting & audit |
| Audit log | Separate table, fire-and-forget | Failures here never block primary operation |
| PDF generation | Client-side (jsPDF) | Zero server load; instant download; works offline |
| Auth | HMAC-signed cookie | No DB session table needed for single-user admin |
| Currency | USD (configurable) | Limoura serves international brand owners primarily billed in USD |

---

## 3. Folder Structure

### Full-Stack Next.js (this repo)

```
limoura-financial-system/
├── ARCHITECTURE.md                  # this document
├── README.md
├── package.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── .env.example
├── prisma/
│   ├── schema.prisma                # DB schema (SQLite/PostgreSQL)
│   └── seed.ts                      # Sample data generator
├── public/
│   ├── favicon.svg
│   └── uploads/                     # Receipt uploads (gitignored)
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx               # Root layout + fonts
│   │   ├── globals.css              # Design tokens
│   │   ├── page.tsx                 # Dashboard (server)
│   │   ├── sales/page.tsx           # Sales list
│   │   ├── expenses/page.tsx        # Expenses list
│   │   ├── clients/page.tsx         # Client directory
│   │   ├── analytics/page.tsx       # Deep analytics
│   │   ├── reports/page.tsx         # PDF generator
│   │   ├── login/page.tsx
│   │   ├── not-found.tsx
│   │   └── api/
│   │       ├── auth/{login,logout}/route.ts
│   │       ├── sales/route.ts                # GET, POST
│   │       ├── sales/[id]/route.ts           # GET, PATCH, DELETE
│   │       ├── expenses/[...]
│   │       ├── clients/[...]
│   │       └── analytics/route.ts
│   ├── components/
│   │   ├── layout/                  # Sidebar, MobileBar, AppShell
│   │   ├── ui/                      # Button, Card, Input, Drawer, etc.
│   │   ├── dashboard/               # KPI, QuickInsights, TopClients
│   │   ├── charts/                  # TrendChart, DonutChart, BarChart
│   │   ├── sales/                   # SalesView, SaleForm
│   │   ├── expenses/                # ExpensesView, ExpenseForm
│   │   ├── clients/                 # ClientsView, ClientForm
│   │   ├── analytics/               # AnalyticsView
│   │   └── reports/                 # ReportsView
│   ├── lib/
│   │   ├── prisma.ts                # Singleton client
│   │   ├── analytics.ts             # All aggregation logic
│   │   ├── pdf-export.ts            # jsPDF + autoTable templates
│   │   ├── formatters.ts            # Money, date, percent
│   │   ├── auth.ts                  # Cookie/HMAC helpers
│   │   ├── audit.ts                 # Mutation logger
│   │   └── utils.ts                 # cn() + small helpers
│   ├── constants/
│   │   └── index.ts                 # SERVICE_TYPES, categories, colors
│   ├── types/
│   │   └── index.ts                 # Shared TS interfaces
│   └── middleware.ts                # Auth gate
└── laravel-backend/                 # Optional Laravel API scaffold
    ├── app/
    │   ├── Http/Controllers/Api/
    │   ├── Models/
    │   └── Services/
    ├── database/migrations/
    └── routes/api.php
```

### Laravel API (alternate backend)

```
laravel-backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   │   ├── AuthController.php
│   │   │   ├── SaleController.php
│   │   │   ├── ExpenseController.php
│   │   │   ├── ClientController.php
│   │   │   └── AnalyticsController.php
│   │   ├── Middleware/
│   │   │   └── EnsureAdmin.php
│   │   └── Requests/                 # Form request validation
│   ├── Models/
│   │   ├── Sale.php
│   │   ├── Expense.php
│   │   ├── Client.php
│   │   └── AuditLog.php
│   └── Services/
│       ├── AnalyticsService.php
│       └── AuditService.php
├── database/migrations/
│   └── *_create_*_table.php
├── routes/api.php
└── config/
```

---

## 4. Database Schema

All financial values are stored as **integer cents** to eliminate floating-point arithmetic errors. Helper functions in `src/lib/formatters.ts` convert at the UI boundary.

### `clients`

| Column | Type | Notes |
|---|---|---|
| id | CUID / UUID | PK |
| name | string | Required, indexed |
| company | string? | |
| email | string? | |
| phone | string? | |
| country | string? | |
| notes | text? | |
| createdAt | timestamp | |
| updatedAt | timestamp | |
| deletedAt | timestamp? | Soft delete |

**Indexes:** `name`, `deletedAt`

### `sales`

| Column | Type | Notes |
|---|---|---|
| id | CUID / UUID | PK |
| invoiceNumber | string | **Unique** |
| projectName | string | Required |
| serviceType | string | Enum-constrained at app layer |
| clientId | FK → clients.id | |
| revenueCents | int | ≥ 0 |
| projectCostCents | int | ≥ 0; direct cost attributable to project |
| paymentStatus | enum | `PAID` / `PARTIAL` / `PENDING` / `OVERDUE` |
| paymentMethod | string? | Bank Transfer, PayPal, Wise, etc. |
| amountPaidCents | int | ≥ 0; for partial payments |
| invoiceDate | date | Indexed |
| dueDate | date? | |
| paidDate | date? | |
| notes | text? | |
| attachmentUrl | string? | Receipt / invoice PDF |
| createdAt / updatedAt / deletedAt | timestamps | |

**Indexes:** `clientId`, `invoiceDate`, `paymentStatus`, `serviceType`, `deletedAt`
**Computed (not stored):** `profitCents = revenueCents - projectCostCents`

### `expenses`

| Column | Type | Notes |
|---|---|---|
| id | CUID / UUID | PK |
| category | string | Indexed; from EXPENSE_CATEGORIES constant |
| subcategory | string? | e.g. "Adobe Creative Cloud" under "Software Subscriptions" |
| vendor | string? | |
| description | text? | |
| amountCents | int | > 0 |
| expenseDate | date | Indexed |
| receiptUrl | string? | Path under `/public/uploads/` |
| createdAt / updatedAt / deletedAt | timestamps | |

**Indexes:** `category`, `expenseDate`, `deletedAt`

### `audit_logs`

| Column | Type | Notes |
|---|---|---|
| id | CUID / UUID | PK |
| actor | string | "admin" or future user email |
| action | enum | `CREATE` / `UPDATE` / `DELETE` / `RESTORE` |
| entityType | string | "Sale" / "Expense" / "Client" |
| entityId | string | |
| payload | text? | JSON snapshot of state |
| createdAt | timestamp | Indexed |

**Indexes:** `(entityType, entityId)`, `createdAt`

---

## 5. Entity Relationship Design

```
┌─────────────────┐         ┌──────────────────────┐
│     Client      │         │        Sale          │
├─────────────────┤         ├──────────────────────┤
│ id (PK)         │◄────────│ clientId (FK)        │
│ name            │  1 : N  │ invoiceNumber (UK)   │
│ company         │         │ projectName          │
│ email           │         │ serviceType          │
│ phone           │         │ revenueCents         │
│ country         │         │ projectCostCents     │
│ notes           │         │ paymentStatus        │
│ deletedAt       │         │ paymentMethod        │
└─────────────────┘         │ amountPaidCents      │
                            │ invoiceDate          │
                            │ dueDate              │
                            │ paidDate             │
                            │ notes                │
                            │ attachmentUrl        │
                            │ deletedAt            │
                            └──────────────────────┘

┌─────────────────────┐         ┌──────────────────────┐
│      Expense        │         │      AuditLog        │
├─────────────────────┤         ├──────────────────────┤
│ id (PK)             │         │ id (PK)              │
│ category            │         │ actor                │
│ subcategory         │         │ action               │
│ vendor              │         │ entityType           │
│ description         │         │ entityId             │
│ amountCents         │         │ payload              │
│ expenseDate         │         │ createdAt            │
│ receiptUrl          │         └──────────────────────┘
│ deletedAt           │
└─────────────────────┘
```

**Relationships:**
- `Client 1 : N Sale` — one client can have many invoices/projects
- `Expense` is standalone (no FK to project; expenses are operational, not project-attributable)
- `AuditLog` uses a polymorphic-style `entityType + entityId` pair — no FK because soft-deleted/hard-deleted entities still need audit history

**Why no `Project` table?** A "project" is captured by a single `Sale` row (`projectName + serviceType + projectCostCents`). Splitting projects into their own table is reserved for v2 if projects need multiple invoices or recurring billing.

---

## 6. API Structure & Endpoints

All endpoints return JSON. All mutating endpoints require an authenticated admin cookie.

### Auth

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/api/auth/login` | `{email, password}` | `200 {ok}` + sets cookie / `401` |
| POST | `/api/auth/logout` | — | `200 {ok}` + clears cookie |

### Sales

| Method | Path | Query / Body | Notes |
|---|---|---|---|
| GET | `/api/sales` | `?from&to&clientId&serviceType&status&take` | Filter + paginate |
| POST | `/api/sales` | Sale payload | Returns created sale |
| GET | `/api/sales/[id]` | — | Single sale + client |
| PATCH | `/api/sales/[id]` | Partial Sale | |
| DELETE | `/api/sales/[id]` | — | Soft delete |

### Expenses

| Method | Path | Query / Body | Notes |
|---|---|---|---|
| GET | `/api/expenses` | `?from&to&category&take` | |
| POST | `/api/expenses` | Expense payload | |
| PATCH | `/api/expenses/[id]` | Partial Expense | |
| DELETE | `/api/expenses/[id]` | — | Soft delete |

### Clients

| Method | Path | Notes |
|---|---|---|
| GET | `/api/clients` | List with sale counts |
| POST | `/api/clients` | |
| PATCH | `/api/clients/[id]` | |
| DELETE | `/api/clients/[id]` | Soft delete |

### Analytics

| Method | Path | Query | Returns |
|---|---|---|---|
| GET | `/api/analytics` | `?from&to` | `{ overview, trend, clients, services, distribution, insights }` |

### Standard Response Shape

**Success:**
```json
{ "data": <T> }
```

**Error:**
```json
{ "error": "Human-readable message", "details": { ... } }
```

**Status codes:**
- `200` OK
- `201` Created
- `400` Validation error
- `401` Unauthorized
- `404` Not found
- `409` Conflict (e.g. duplicate invoiceNumber)
- `500` Server error

---

## 7. Backend Architecture (Laravel)

If you prefer Laravel over Next.js Route Handlers, the `laravel-backend/` folder contains a skeleton. The architecture mirrors the Next.js version:

### Layers

```
HTTP Request
    │
    ▼
Route (routes/api.php)
    │
    ▼
Middleware (auth, request validation)
    │
    ▼
Controller (thin — orchestration only)
    │
    ▼
Service (business logic, e.g. AnalyticsService)
    │
    ▼
Eloquent Model (repository pattern via model scopes)
    │
    ▼
Database (PostgreSQL)
```

### Key Conventions

- **Thin controllers, fat services.** Controllers only parse requests and return responses. All business logic lives in `app/Services/`.
- **Form Requests** for validation: `app/Http/Requests/StoreSaleRequest.php`, etc.
- **Resources** (`App\Http\Resources\SaleResource`) for response shaping, so API contracts are explicit.
- **Sanctum** for cookie-based admin auth (or simple HMAC if you stay single-user).
- **Soft Deletes** trait on all primary models.
- **Observer pattern** for audit logging — `SaleObserver` writes to `audit_logs` on every `created/updated/deleted` event.

### Sample Laravel Controller Pattern

```php
class SaleController extends Controller
{
    public function __construct(private AnalyticsService $analytics) {}

    public function index(Request $request)
    {
        $sales = Sale::with('client')
            ->when($request->from, fn($q, $v) => $q->where('invoice_date', '>=', $v))
            ->when($request->to,   fn($q, $v) => $q->where('invoice_date', '<=', $v))
            ->when($request->status, fn($q, $v) => $q->where('payment_status', $v))
            ->orderByDesc('invoice_date')
            ->paginate(50);

        return SaleResource::collection($sales);
    }

    public function store(StoreSaleRequest $request)
    {
        $sale = Sale::create($request->validated());
        return new SaleResource($sale);
    }
}
```

---

## 8. Frontend Architecture (Next.js)

### Rendering Strategy

| Page | Rendering | Reason |
|---|---|---|
| `/` (Dashboard) | **Server Component** | All data fetched server-side, no client JS for KPIs |
| `/sales` | Server shell + Client island | Initial data SSR'd; mutations via fetch in client |
| `/expenses` | Server shell + Client island | Same pattern as sales |
| `/clients` | Server shell + Client island | |
| `/analytics` | Server shell + Client island | Date-range filter triggers re-fetch |
| `/reports` | Client component | PDF generation runs in browser |
| `/login` | Client component | Form state |

### Component Hierarchy

```
RootLayout (fonts, html shell)
└── Page (server)
    └── AppShell
        ├── Sidebar (client)
        ├── MobileBar (client)
        └── main
            ├── PageHeader
            └── [Page-specific content]
                ├── Card → KpiCard / TrendChart / Table
                └── Drawer → SaleForm / ExpenseForm / ClientForm
```

### Data Flow

1. **Initial render:** Server component queries Prisma directly, hydrates with full data.
2. **Mutations:** Client component calls fetch → API route → DB → returns updated data.
3. **Re-fetch:** After successful mutation, client re-fetches the list to update state. No SWR/React Query needed at this scale — the page is small enough that one round trip is fine.
4. **Filters:** Held in client state; date-range filters in `/analytics` trigger a re-fetch of `/api/analytics`.

### Why no SWR / React Query?

This is a single-user admin tool with maybe 50–500 rows per table. Cache invalidation, optimistic updates, and stale-while-revalidate add complexity for marginal benefit. A simple `useEffect + fetch + setState` pattern is more maintainable.

If you scale to many users or background data refresh becomes desirable, add **TanStack Query** to the sales/expenses views.

---

## 9. Dashboard UI Structure

### Layout

```
┌───────────────────────────────────────────────────────────────────┐
│  PageHeader: "Dashboard"  |  Overview                             │
├───────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Revenue  │  │ Expenses │  │  Profit  │  │ Outstand │  ← KPI    │
│  │  $42.1K  │  │  $28.4K  │  │  $13.7K  │  │   $5.2K  │           │
│  │  ▲ +12%  │  │  ▲  +8%  │  │  ▲ +21%  │  │          │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
├───────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────┐  ┌────────────────────────┐  │
│  │       Monthly Trend             │  │   Quick Insights       │  │
│  │   (Stacked area: rev/exp/prof)  │  │                        │  │
│  │                                 │  │   • Video Editing has  │  │
│  │     ___/\___/\___/\___          │  │     highest margin     │  │
│  │                                 │  │   • Adobe up 15% MoM   │  │
│  └─────────────────────────────────┘  └────────────────────────┘  │
├───────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────┐  ┌────────────────────────┐  │
│  │   Expense Distribution          │  │   Top Clients          │  │
│  │   (Donut chart + legend)        │  │   (Ranked list w/ bar) │  │
│  │                                 │  │                        │  │
│  │     ○ Salaries 42%              │  │   01 Verdant   $12.4K  │  │
│  │     ○ Software 18%              │  │   02 Pacific   $ 8.1K  │  │
│  └─────────────────────────────────┘  └────────────────────────┘  │
├───────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │   Service Profitability                                     │  │
│  │   (List with margin % and profit per service)               │  │
│  └─────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

### Design Language

- **Typography**
  - Headings: *Instrument Serif* (editorial, refined)
  - UI / Body: *Geist Sans* (clean, modern, neutral)
  - Numbers: *JetBrains Mono* with `font-variant-numeric: tabular-nums` everywhere money appears
- **Color**
  - Background: white `#FFFFFF`
  - Text: `#0A0A0A` primary, `#737373` muted
  - Borders: `#E5E5E5`
  - Single accent: forest green `#1F3D2B`
  - Negative semantic: muted clay `#9B3A2E`
- **Spacing:** Generous — 32px+ between sections, 20px card padding
- **Borders over shadows:** 1px borders, never heavy drop shadows
- **Hover:** Subtle background tint shift, no transforms
- **Motion:** 240ms ease-out for drawer slide-in; otherwise static

---

## 10. Analytics Module Design

### Aggregation Engine (`src/lib/analytics.ts`)

A single TypeScript module exposes six pure functions:

| Function | Returns | Purpose |
|---|---|---|
| `getOverview(range?)` | `{ revenue, expenses, profit, margin, outstanding, deltas }` | KPI summary + period-over-period change |
| `getMonthlyTrend(months)` | `MonthlyPoint[]` | Bucketed monthly time series |
| `getClientProfitability(range?)` | `ClientProfitabilityRow[]` | Per-client revenue, cost, profit |
| `getServiceProfitability(range?)` | `ServiceProfitabilityRow[]` | Per-service margin and profit |
| `getExpenseDistribution(range?)` | `ExpenseDistributionRow[]` | Category breakdown + share |
| `getQuickInsights()` | `QuickInsight[]` | Rule-based natural language observations |

### Quick Insights Rules

Implemented as a small rules engine, not LLM:

1. **Highest-margin service** — flag the service with the top profit margin
2. **Top client concentration** — if any client > 40% of revenue → warning, else neutral
3. **Expense delta** — month-over-month change > ±10% → flag
4. **Largest expense category** — show share
5. **Profit trend** — month-over-month delta > ±5% → flag

This avoids LLM dependency and stays explainable, but the structure is ready to be swapped for an LLM call later.

### Profit Calculation

```
Project Profit = Revenue - Project Cost
Net Profit     = Sum(Revenue) - Sum(Project Cost) - Sum(Operational Expense)
Margin         = Net Profit / Total Revenue
```

The Net Profit calculation **subtracts both project costs and operational expenses** because:
- Project cost is the direct cost of delivering a single project (freelancer fees, asset purchases for that project)
- Operational expense is fixed overhead (rent, software, salaries)
- Both must be deducted from revenue to get true profitability

### Period-Over-Period

For deltas, the same period length is compared:
- Last 30 days → previous 30 days
- Last quarter → previous quarter

This is built into `getOverview()` automatically.

---

## 11. Suggested Charts & KPIs

### KPI Cards (Dashboard top row)

| KPI | Color signal | Delta direction interpretation |
|---|---|---|
| Total Revenue | accent if up | Up = good |
| Total Expenses | clay if up | Up = bad (invertDelta=true) |
| Net Profit | accent if up | Up = good |
| Outstanding Payments | neutral | Informational only |

Optional: Average Project Value, Avg Days to Payment, Active Clients (30d).

### Charts

| Chart | Library | Where used |
|---|---|---|
| Stacked Area | Recharts | Dashboard monthly trend; Analytics trend |
| Donut | Recharts | Expense distribution |
| Horizontal Bar | Recharts | Service profitability comparison |
| Progress bars | Plain CSS | Top clients list |

### Why Recharts (not ApexCharts)

- Better React integration, declarative API
- Smaller bundle (~70KB vs ~200KB)
- Easier to style with Tailwind
- ApexCharts has nicer defaults out of the box but is harder to tame visually

### Chart Style Rules

- No 3D
- No gradients other than subtle fade for area charts
- Tick lines and axis lines: removed
- Grid: dashed `#E5E5E5`, only horizontal
- Tooltip: white card with 1px border, no shadow
- Legend: top-right, small circles, neutral text

---

## 12. Authentication Flow

### Why HMAC cookie, not full session DB?

Single user. No need for `sessions` table, no JWT refresh dance. An HMAC-signed cookie:
1. Contains the admin email
2. Signed with `AUTH_SECRET`
3. Verified on every protected request via middleware

```
POST /api/auth/login   {email, password}
    │
    ▼
Check against env credentials
    │
    ▼
Sign email with HMAC-SHA256(AUTH_SECRET)
    │
    ▼
Set httpOnly cookie: limoura_admin=base64(email).base64(sig)
    │
    ▼
Redirect to /
```

```
Any protected request
    │
    ▼
Middleware reads cookie
    │
    ▼
Verify HMAC
    │
    ├── valid    → proceed
    └── invalid  → 401 (API) or redirect to /login (pages)
```

### Credentials Storage

For this scale (single admin), credentials live in `.env`:

```
ADMIN_EMAIL=admin@limoura.studio
ADMIN_PASSWORD=changeme
AUTH_SECRET=long-random-string
```

**Upgrade path:** When you need >1 user, replace this with NextAuth + Prisma adapter, or Laravel Sanctum, and add a `users` table with hashed passwords.

---

## 13. PDF Export Architecture

### Why Client-Side?

- **Zero server load** — no headless Chrome, no Puppeteer infrastructure
- **Instant download** — no round trip
- **Works offline** once the app is loaded
- **No PDF byte-streaming complexity**

### Implementation

`src/lib/pdf-export.ts` provides three generators:

| Function | Output |
|---|---|
| `generateFinancialReport(data)` | Multi-page summary: KPIs + monthly trend + service/client/expense tables |
| `generateRevenueReport(sales, range)` | All invoices with status, profit, totals |
| `generateExpenseReport(expenses, range)` | All operational costs with categories |

Each PDF includes:
- Header: brand mark, title, subtitle (date range)
- KPI row: 3–4 big numbers
- Section titles with horizontal rules
- Tables via `jspdf-autotable` with consistent column alignment
- Footer with timestamp and page numbers

### Design

Minimal layout matching the screen UI: black text on white, no color fills, thin separators. The font defaults to Helvetica (jsPDF built-in) for portability — no font embedding required.

### Future: Server-Side PDFs

When you need branded high-fidelity PDFs (with charts as images, embedded fonts, complex layouts), switch to **Puppeteer** rendering an HTML report template, or **React-PDF** for declarative React-based PDFs. Both are heavier to operate.

---

## 14. Recommended Packages & Libraries

### Frontend (Next.js)

| Package | Purpose | Why this one |
|---|---|---|
| `next` | Framework | App Router for nested layouts + server components |
| `react`, `react-dom` | UI | |
| `typescript` | Type safety | |
| `tailwindcss` | Styling | Utility-first, fast iteration |
| `@prisma/client` + `prisma` | ORM | Type-safe queries, migrations, supports SQLite + Postgres |
| `zod` | Runtime validation | Single source of truth for API + form schemas |
| `recharts` | Charts | Lightweight, React-native, Tailwind-stylable |
| `lucide-react` | Icons | Clean, consistent, tree-shakable |
| `date-fns` | Date utilities | Smaller than moment, immutable |
| `clsx` + `tailwind-merge` | Class composition | Standard pattern with `cn()` helper |
| `jspdf` + `jspdf-autotable` | PDF generation | Client-side, no headless browser needed |
| `html2canvas` | Optional: chart-to-image | For PDFs that need embedded chart screenshots |

### Backend (Laravel — if used)

| Package | Purpose |
|---|---|
| `laravel/framework` | Core |
| `laravel/sanctum` | Cookie-based admin auth |
| `spatie/laravel-query-builder` | Filter/sort query parsing |
| `barryvdh/laravel-dompdf` | PDF generation (alternative to client-side) |

### Why NOT these (intentional omissions)

- **shadcn/ui CLI** — components are inlined directly to remove the CLI dependency for first-time setup. Patterns mirror shadcn so migration is straightforward later.
- **TanStack Query / SWR** — overkill for this scale.
- **Redux / Zustand** — no global state needed.
- **NextAuth** — overkill for single admin; can be added later.

---

## 15. Development Roadmap

### Phase 1 — Foundation (Week 1)
- ✅ Project setup, Tailwind config, design tokens
- ✅ Database schema, Prisma + seed
- ✅ UI primitives (Button, Card, Input, Drawer, Table, Badge)
- ✅ Layout (Sidebar, AppShell, MobileBar)
- ✅ Cookie auth + login page

### Phase 2 — Core CRUD (Week 2)
- ✅ Sales module (list, create, edit, soft-delete)
- ✅ Expenses module
- ✅ Clients module
- ✅ Audit log integration

### Phase 3 — Analytics (Week 3)
- ✅ Analytics engine (`analytics.ts`)
- ✅ Dashboard with KPIs + charts
- ✅ Quick Insights rules engine
- ✅ Analytics page with date filtering

### Phase 4 — Reports (Week 4)
- ✅ PDF templates (Financial, Revenue, Expense)
- ✅ Reports page with range picker
- ✅ Per-section PDF export from list pages

### Phase 5 — Polish (Week 5)
- File upload for receipts/invoice attachments
- Keyboard shortcuts (Cmd+K, Cmd+N)
- Empty/loading/error states refinement
- Print stylesheet for reports
- Light data integrity checks (e.g. amountPaid > revenue warning)

### Phase 6 — Optional Migrations
- Swap SQLite → PostgreSQL
- Migrate to Laravel API if preferred
- Deploy (Vercel for frontend; managed PG for DB)

---

## 16. MVP vs Future Features

### MVP (Shipped in this build)

| Module | Feature |
|---|---|
| Dashboard | KPIs, trend chart, insights, top clients, expense distribution |
| Sales | List + CRUD + search/filter + PDF |
| Expenses | List + CRUD + filter + PDF |
| Clients | List + CRUD |
| Analytics | Date-range filtering, per-service/client breakdown |
| Reports | Financial, Revenue, Expense PDFs |
| Auth | Cookie-based admin |
| Audit | Mutation log |

### Future (Phase 2+)

| Feature | Notes |
|---|---|
| File uploads | S3-compatible storage for receipts |
| Multi-currency | Store currency code per sale; convert for reports |
| Recurring invoices | Auto-generate monthly subscriptions |
| Forecasting | Simple linear projection of next quarter |
| Tax tracking | VAT/GST per invoice with line items |
| Email reports | Cron job that emails monthly PDF |
| Mobile app | React Native or PWA install prompt |
| LLM insights | Replace rule-based Quick Insights with `claude-sonnet` API call |
| Multi-user | Add roles (admin, viewer); switch to NextAuth |
| Bank reconciliation | Manual or via Plaid for matching transactions |

---

## 17. Best Practices

### Code

- **Server Components by default.** Use Client Components only when interactivity is required (`"use client"`).
- **Co-locate everything.** Component, its types, and its styles live in one file when possible.
- **Validate at the boundary.** Zod schemas at the API layer; never trust client input.
- **Don't reuse types between DB and API.** Prisma generates DB types; you write API response types separately. This decouples migrations from API contracts.
- **Money in cents.** Always. Convert at format boundaries only.
- **Soft delete first.** Hard delete only via a separate admin-only "purge" route, never from the UI.

### Database

- **One migration per feature.** No squashing in development; keeps history readable.
- **Indexes on every filterable column.** `date`, `status`, foreign keys.
- **Don't store computed values.** `profit` is computed from `revenue - cost`; don't denormalize unless reporting requires it.
- **Snapshots for audit.** The `payload` column on `audit_logs` stores a JSON snapshot of the entity at mutation time — invaluable for "what did this row look like last Tuesday?" debugging.

### UI

- **Tabular numerals everywhere money appears.** Use `.num` class.
- **Aligned right for numbers.** Improves scannability in tables.
- **One accent color.** Don't add a second decorative color; it dilutes the design system.
- **Hover states are subtle.** A 5% background tint is more refined than a transform or shadow.
- **Empty states matter.** Every list view should have a thoughtful empty state with a clear CTA.

---

## 18. Scalability Considerations

### At current scale (1 admin, ~500 rows/year)

The architecture is fine as-is. SQLite handles this comfortably.

### At 10× scale (10K rows, occasional team access)

| Concern | Action |
|---|---|
| Database | Switch to PostgreSQL; add connection pooling (PgBouncer) |
| Queries | Add composite indexes on `(invoiceDate, paymentStatus)`, etc. |
| Analytics | Cache `getMonthlyTrend` in memory or Redis (5-min TTL) |
| List pages | Add server-side pagination (currently all-at-once) |
| Auth | Move to NextAuth + DB sessions |
| Search | Add full-text search via PostgreSQL `tsvector` |

### At 100× scale (100K+ rows, multi-tenant)

| Concern | Action |
|---|---|
| Analytics | Pre-aggregate into materialized views or a separate `daily_summaries` table |
| Database | Read replicas; partition `sales` by year |
| Architecture | Split into microservices: core CRUD, analytics, reports |
| Frontend | Server-side rendering with caching (Next.js ISR or RSC streaming) |
| Reports | Move to server-side PDF rendering with a queue (BullMQ + headless Chrome) |
| Storage | Object storage (S3) for receipts, signed URLs for downloads |

---

## 19. Security Recommendations

### Production Checklist

- [ ] Change all `.env` defaults: `ADMIN_PASSWORD`, `AUTH_SECRET`
- [ ] Use a strong `AUTH_SECRET` (32+ random bytes)
- [ ] Hash the admin password — currently compared in plaintext for dev simplicity; **upgrade to bcrypt before any deployment**
- [ ] Set `secure: true` on the auth cookie in production
- [ ] Add `Content-Security-Policy` headers
- [ ] Enable HTTPS-only (Vercel does this automatically)
- [ ] Add rate limiting on `/api/auth/login` (e.g. via Upstash Rate Limit)
- [ ] Sanitize file uploads — check MIME type, size limit, scan for malware
- [ ] Don't store sensitive data in audit log payloads (PII redaction)
- [ ] Keep `node_modules` and Prisma client up to date — run `npm audit` regularly
- [ ] Back up the database daily (cron + pgdump for Postgres)

### Threat Model

| Threat | Mitigation |
|---|---|
| Credential brute-force | Rate limit on `/api/auth/login`; account lockout after 10 attempts |
| Cookie theft | `httpOnly`, `sameSite: lax`, `secure: true` in prod |
| CSRF | `sameSite: lax` cookie + non-GET requests require JSON body |
| SQL injection | Prisma uses parameterized queries — safe by default |
| XSS | React escapes by default; never use `dangerouslySetInnerHTML` with user input |
| Data exfiltration | Add audit log for all read operations if regulatory concerns arise |

---

## 20. Suggested UI Layouts

### Dashboard

See section 9. Four KPIs across, then a 2-column split for trend + insights, then expense distribution + top clients, then full-width service profitability.

### Sales / Expenses list pages

```
┌──────────────────────────────────────────────────────────────────┐
│  PageHeader: "Sales"  |  Revenue                                 │
├──────────────────────────────────────────────────────────────────┤
│  [🔍 Search...]  [Filter: Service ▾]  [Filter: Status ▾]         │
│                                       [Export PDF] [+ New]      │
├──────────────────────────────────────────────────────────────────┤
│  Invoice    Date     Client      Project       Revenue  Status   │
│  LIM-0034   Oct 12   Verdant     A+ Content    $2,400   Paid     │
│  LIM-0033   Oct 10   Pacific     Listing Img   $1,200   Pending  │
│  ...                                                             │
├──────────────────────────────────────────────────────────────────┤
│  142 invoices                              Total: $234,890       │
└──────────────────────────────────────────────────────────────────┘
```

### Form (right-side drawer)

```
                              ┌──────────────────────────────┐
                              │  ✕                           │
                              │  New Invoice                 │
                              │  Add a new revenue entry     │
                              ├──────────────────────────────┤
                              │  Invoice Number              │
                              │  [____________________]      │
                              │                              │
                              │  Project Name                │
                              │  [____________________]      │
                              │                              │
                              │  Client      Service Type    │
                              │  [▾]         [▾]             │
                              │                              │
                              │  Financials                  │
                              │  Revenue   Cost    Profit    │
                              │  [_____]   [_____] $2,000    │
                              │                              │
                              │  Payment                     │
                              │  Status  Method  Amount Paid │
                              │  [▾]     [▾]     [_____]     │
                              ├──────────────────────────────┤
                              │           [Cancel] [Create]  │
                              └──────────────────────────────┘
```

### Analytics page

```
┌──────────────────────────────────────────────────────────────────┐
│  PageHeader: "Analytics"  |  Insights        [Period: 6mo ▾]     │
├──────────────────────────────────────────────────────────────────┤
│   Revenue   Expenses   Net Profit   Margin                       │
│   $42.1K    $28.4K     $13.7K       32.6%                        │
├──────────────────────────────────────────────────────────────────┤
│   Revenue, Expense & Profit Trend                                │
│   [Full-width area chart, 320px tall]                            │
├────────────────────────────────┬─────────────────────────────────┤
│   Service Profitability        │   Expense Distribution          │
│   [Horizontal bar chart]       │   [Donut + legend]              │
├────────────────────────────────┴─────────────────────────────────┤
│   Client Profitability  [sortable table]                         │
├──────────────────────────────────────────────────────────────────┤
│   Service Detail  [sortable table with margin %]                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## 21. Database Optimizations

### Indexes

Already in the Prisma schema, but worth calling out:

```prisma
@@index([clientId])
@@index([invoiceDate])
@@index([paymentStatus])
@@index([serviceType])
@@index([deletedAt])
```

### Composite indexes for common queries

For PostgreSQL, add when at scale:

```sql
CREATE INDEX idx_sales_status_date ON sales (payment_status, invoice_date DESC);
CREATE INDEX idx_sales_client_date ON sales (client_id, invoice_date DESC);
CREATE INDEX idx_expenses_category_date ON expenses (category, expense_date DESC);
```

### Materialized views (at scale)

Pre-compute monthly aggregates:

```sql
CREATE MATERIALIZED VIEW monthly_summary AS
SELECT
    date_trunc('month', invoice_date) as month,
    SUM(revenue_cents) as revenue,
    SUM(project_cost_cents) as cost,
    SUM(revenue_cents - project_cost_cents) as profit,
    COUNT(*) as project_count
FROM sales
WHERE deleted_at IS NULL
GROUP BY 1;

CREATE UNIQUE INDEX ON monthly_summary (month);

-- Refresh nightly via cron:
REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_summary;
```

### Connection Pooling

For Vercel + Postgres, use **Prisma Accelerate** or **PgBouncer** to avoid connection storms during cold starts.

### Query Optimization

- Always select only needed columns: `select: { revenueCents: true, ... }` over `*`
- Use `findMany` with `take` rather than fetching all and slicing
- Batch related queries with `Promise.all` — already done in the analytics engine

---

## 22. Naming Conventions

### TypeScript / JavaScript

- **Files:** `PascalCase.tsx` for components, `camelCase.ts` for utilities
- **Components:** `PascalCase` exports (`SaleForm`, not `saleForm`)
- **Hooks:** `useCamelCase` (`useSalesData`)
- **Utility functions:** `camelCase` (`formatMoney`, `dollarsToCents`)
- **Constants:** `SCREAMING_SNAKE_CASE` for true constants (`SERVICE_TYPES`, `CHART_COLORS`)
- **Types/Interfaces:** `PascalCase` (`Sale`, `DashboardOverview`)
- **Boolean variables:** Prefix with `is/has/can` (`isLoading`, `hasError`)

### Database (PostgreSQL)

- **Tables:** `snake_case`, plural (`sales`, `audit_logs`)
- **Columns:** `snake_case` (`invoice_number`, `created_at`)
- **Indexes:** `idx_{table}_{columns}` (`idx_sales_invoice_date`)
- **Foreign keys:** `fk_{table}_{column}` (`fk_sales_client_id`)

### Prisma → camelCase mapping

Prisma's default is `camelCase` in the schema; it maps to `snake_case` columns automatically via `@@map` and `@map` if needed:

```prisma
model Sale {
  invoiceNumber String @map("invoice_number")
  @@map("sales")
}
```

### API URLs

- **Plural resources:** `/api/sales`, not `/api/sale`
- **Nested for relationships:** `/api/clients/[id]/sales` if added
- **kebab-case for multi-word:** `/api/audit-logs`

---

## 23. State Management

### Decision: No global state library

For this scale, all state is either:

1. **Server state** — fetched in Server Components, passed as props
2. **Local form state** — React `useState` inside form components
3. **URL state** — date ranges, filters, search queries via `useSearchParams`
4. **Re-fetch on mutation** — after a successful create/update/delete, call `reload()` which re-fetches the list

### When to add global state

Add **Zustand** (preferred over Redux) only if:
- A user preference (e.g. dark mode, column visibility) needs to persist across pages
- A toast/notification system is added
- Cross-page filters need to sync (e.g. selected client filter persists from Dashboard to Sales)

### Don't use Context for everything

Context is fine for theme, but avoid using it as a state store. Either pass props or use Zustand.

---

## 24. Clean Coding Practices

### Function Design

- **Single responsibility.** `getClientProfitability()` aggregates — it doesn't fetch, format, or render.
- **Pure functions for analytics.** No side effects, deterministic output → easy to test.
- **Small files.** If a component exceeds ~200 lines, split it.

### Error Handling

- **Never silently swallow errors.** Log them, even if you can't recover.
- **User-friendly messages.** "Failed to save" → "Could not save invoice. Check the date format and try again."
- **API errors return JSON, never HTML.** Even on 500.

### Comments

- **Why, not what.** The code shows what; comments explain why.
- **Top-of-file context** for modules with non-obvious decisions (e.g. why money is in cents — see `formatters.ts`).

### Testing Strategy (future)

| Layer | Tool | Coverage target |
|---|---|---|
| Pure functions (`analytics.ts`, `formatters.ts`) | Vitest | 80%+ |
| API routes | Vitest + supertest-style | Happy path + auth + validation |
| Components | React Testing Library | Critical flows only (forms, drawer) |
| E2E | Playwright | Login → create sale → see in dashboard |

---

## Appendix A — Manual Data Entry Speed Tips

To make this tool truly fast for the daily grind:

1. **Tab order** — every form is keyboard-only: tab through fields in logical order, Enter to submit.
2. **Auto-generated invoice numbers** — pre-filled with `LIM-YYYY-####` pattern, editable.
3. **Service type defaults** — remembers the last selected service per session.
4. **Client autocomplete** — search by company name; create-on-the-fly if not found (v2).
5. **Date defaults to today** — invoice date, expense date pre-filled.
6. **Calculated profit live** — as you type revenue and cost, profit updates inline.

---

## Appendix B — Deployment

### Vercel + Supabase Postgres (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Set environment variables: `DATABASE_URL` (Supabase pooled), `ADMIN_*`, `AUTH_SECRET`
4. Vercel runs `prisma generate` during build automatically
5. Run `prisma db push` against the production database once

### Self-hosted (VPS + Docker)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json prisma ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
CMD ["npm", "start"]
```

---

## Appendix C — Migration from SQLite to PostgreSQL

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `.env`: `DATABASE_URL="postgresql://user:pass@host:5432/db"`
3. Run `npx prisma migrate dev --name init`
4. Optionally seed: `npm run db:seed`

Prisma handles the dialect differences. The application code requires no changes.

---

*End of document.*
