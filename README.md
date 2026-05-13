# Limoura Creative Studio — Financial Tracking & Analytics

> Internal admin tool for tracking revenue, expenses, project profitability, and generating reports across the studio's Amazon creative services business.

![status](https://img.shields.io/badge/status-MVP_ready-1F3D2B?style=flat-square)
![next](https://img.shields.io/badge/Next.js-14-0A0A0A?style=flat-square)
![db](https://img.shields.io/badge/SQLite_or_PostgreSQL-via_Prisma-1F3D2B?style=flat-square)

---

## ✦ What this is

A focused **admin-only** financial dashboard for Limoura Creative Studio. Tracks:

- **Revenue** — invoices for Listing Images, A+ Content, Storefront Design, Video Editing, etc.
- **Expenses** — salaries, Adobe subscriptions, AI tools, rent, marketing
- **Profitability** — per project, per client, per service
- **Analytics & reports** — monthly trends, top clients, downloadable PDFs

Everything is manually encoded. No client portal, no employee accounts, no integrations.

---

## ✦ Quickstart

You need **Node.js 18.18+** and **npm**.

```bash
# 1. Install dependencies
npm install

# 2. Create the database and seed sample data
npm run setup
# (equivalent to: npx prisma db push && npm run db:seed)

# 3. Start the dev server
npm run dev
```

Open **http://localhost:3000** and sign in with the dev credentials:

```
Email:    admin@limoura.studio
Password: changeme
```

> Change `ADMIN_PASSWORD` and `AUTH_SECRET` in `.env` before deploying anywhere.

---

## ✦ What's in the box

### Pages

| Route | What it does |
|---|---|
| `/` | **Dashboard** — KPIs, monthly trend, quick insights, top clients, expense distribution, service profitability |
| `/sales` | List, search, filter, create, edit, delete invoices; per-list PDF export |
| `/expenses` | List, search, filter, create, edit, delete operational costs; PDF export |
| `/clients` | Manage client directory |
| `/analytics` | Deep analytics with date-range filter — service breakdown, client breakdown, trend chart |
| `/reports` | Generate downloadable Financial / Revenue / Expense PDFs for any date range |
| `/login` | Admin sign-in |

### Modules

- **Dashboard** with rule-based Quick Insights (e.g. *"Video Editing has the highest profit margin"*)
- **Sales** with payment status (Paid / Partial / Pending / Overdue), invoice numbering, live profit calculation
- **Expenses** by category and subcategory with receipt URL attachments
- **Analytics engine** in `src/lib/analytics.ts` — all aggregation logic in one testable module
- **PDF reports** generated client-side with `jspdf` + `jspdf-autotable`
- **Audit log** of every mutation
- **Soft deletes** preserve historical reporting

---

## ✦ Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router, React Server Components) |
| Language | TypeScript |
| Styling | TailwindCSS + design tokens (CSS variables) |
| Components | Custom shadcn-style primitives (inlined, no CLI dependency) |
| Charts | Recharts |
| Database | SQLite (default) or PostgreSQL (production) |
| ORM | Prisma |
| PDF | jsPDF + jspdf-autotable (client-side) |
| Auth | HMAC-signed cookie (single admin) |
| Icons | lucide-react |

---

## ✦ Design language

Refined minimalism:
- **Type:** Instrument Serif for page titles, Geist/Inter for UI, JetBrains Mono for numbers (tabular figures everywhere money appears)
- **Color:** Monochrome (whites, grays, near-black) with a single accent — forest green `#1F3D2B`
- **Layout:** Generous whitespace, 1px borders rather than shadows, no decorative gradients
- **Motion:** 240ms ease-out for drawer slide-in; otherwise static

---

## ✦ Folder structure

```
limoura-financial-system/
├── ARCHITECTURE.md           # Full planning doc (read this for the deep dive)
├── README.md                 # ← you are here
├── prisma/
│   ├── schema.prisma         # DB schema
│   └── seed.ts               # Sample data
├── src/
│   ├── app/                  # Next.js App Router pages + API routes
│   ├── components/           # UI primitives, layout, dashboard, forms, charts
│   ├── lib/                  # analytics, formatters, prisma, pdf-export, auth
│   ├── constants/            # Service types, expense categories, palette
│   ├── types/                # Shared TS types
│   └── middleware.ts         # Auth gate
└── laravel-backend/          # Optional Laravel API scaffold (see its README)
```

See `ARCHITECTURE.md` for the complete file-by-file walkthrough.

---

## ✦ Common tasks

### Reset the database and re-seed

```bash
npm run db:reset
```

### Inspect the database visually

```bash
npm run db:studio
```

Opens Prisma Studio at http://localhost:5555 — a clean GUI for browsing rows.

### Switch from SQLite to PostgreSQL

1. Edit `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"   // was "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
2. Edit `.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/limoura?schema=public"
   ```
3. Run `npx prisma db push` (or `npx prisma migrate dev --name init` if you want migration files).

### Add a new service type

Edit `src/constants/index.ts`:

```ts
export const SERVICE_TYPES = [
  "Amazon Listing Images",
  "A+ Content",
  // ...
  "Your New Service",   // ← add here
] as const;
```

The new option appears in the SaleForm dropdown immediately.

### Add a new expense category

Same pattern in `src/constants/index.ts`:

```ts
export const EXPENSE_CATEGORIES = [
  // ...
  "Your New Category",
] as const;
```

---

## ✦ API

All endpoints live under `/api/`. See `ARCHITECTURE.md` §6 for the full reference.

```
POST   /api/auth/login          { email, password }
POST   /api/auth/logout

GET    /api/sales?from&to&status&serviceType&clientId&take
POST   /api/sales               { invoiceNumber, projectName, ... }
GET    /api/sales/[id]
PATCH  /api/sales/[id]          { partial sale }
DELETE /api/sales/[id]          (soft delete)

GET    /api/expenses?from&to&category&take
POST   /api/expenses
PATCH  /api/expenses/[id]
DELETE /api/expenses/[id]

GET    /api/clients
POST   /api/clients
PATCH  /api/clients/[id]
DELETE /api/clients/[id]

GET    /api/analytics?from&to
       → { overview, trend, clients, services, distribution, insights }
```

Responses:
- Success: `{ data: <T> }` or `{ ok: true }`
- Error: `{ error: string, details?: object }` with HTTP 400/401/404/409/500

---

## ✦ Production checklist

Before deploying, work through `ARCHITECTURE.md` §19 — the security checklist. Highlights:

- [ ] Change `ADMIN_PASSWORD` and `AUTH_SECRET` in `.env`
- [ ] Hash the admin password (currently compared in plaintext for dev simplicity)
- [ ] Switch to PostgreSQL
- [ ] Set `secure: true` on auth cookie (auto-enabled on HTTPS)
- [ ] Add rate limiting on `/api/auth/login`
- [ ] Enable daily database backups

Recommended hosting: **Vercel** (frontend) + **Supabase** or **Neon** (PostgreSQL).

---

## ✦ Documentation

- **`ARCHITECTURE.md`** — full architecture, ERD, API spec, security, scalability, naming conventions, deployment guide
- **`laravel-backend/README.md`** — when and how to use the optional Laravel backend

---

## ✦ License

Internal tool for Limoura Creative Studio. Not licensed for redistribution.
