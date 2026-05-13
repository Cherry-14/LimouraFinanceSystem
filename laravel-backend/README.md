# Laravel Backend (Optional)

The Next.js app in the parent directory ships with **built-in API routes** that are fully functional. This folder contains a **Laravel scaffold** for when you want to migrate the API to a separate Laravel service.

## When to use this

Use the Laravel backend if:
- You want to host the API independently (separate deployment, separate scaling)
- You have existing Laravel infrastructure (PHP team, Forge/Vapor, etc.)
- You need server-side features that are easier in PHP (queues, scheduled jobs, complex reports)

If none of the above applies, **stick with the Next.js API routes** — they work, they're typed, and you have one less service to deploy.

## Setup

```bash
cd laravel-backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

## Architecture

This is a thin Laravel 11 API:

```
laravel-backend/
├── app/
│   ├── Http/Controllers/Api/   # Thin controllers — only orchestration
│   │   ├── AuthController.php
│   │   ├── SaleController.php
│   │   ├── ExpenseController.php
│   │   ├── ClientController.php
│   │   └── AnalyticsController.php
│   ├── Models/                  # Eloquent models with SoftDeletes + UUIDs
│   │   ├── Sale.php
│   │   ├── Expense.php
│   │   ├── Client.php
│   │   └── AuditLog.php
│   └── Services/                # Business logic
│       ├── AnalyticsService.php # Mirrors src/lib/analytics.ts
│       └── AuditService.php
├── database/migrations/         # Schema parity with prisma/schema.prisma
└── routes/api.php
```

## API contract

The Laravel API exposes **the same endpoints with the same payload shapes** as the Next.js routes documented in `/ARCHITECTURE.md` §6. The Next.js frontend can be pointed at this backend by changing fetch URLs from relative (`/api/sales`) to absolute (`https://api.limoura.local/sales`) and adding the appropriate CORS configuration.

## Migration path: Next.js routes → Laravel API

1. Run `composer install` and `php artisan migrate` against your PostgreSQL database
2. Configure CORS in `bootstrap/app.php` to allow your Next.js origin
3. Replace fetch URLs in the Next.js client components (search the codebase for `/api/`)
4. Update the Next.js middleware to forward auth cookies to the Laravel backend, or share an auth domain
5. Run both side-by-side during cutover, then retire the Next.js `/api` folder

## What's not included

- `bootstrap/app.php`, `config/`, full `.env.example`, `artisan`, `public/index.php` — generate these with `composer create-project laravel/laravel .` first, then drop these files in
- Full Sanctum setup — see Laravel docs at https://laravel.com/docs/11.x/sanctum
- Tests, factories, seeders — add as needed

The intent of this folder is to give you working **domain logic** (models, controllers, services, migrations) so you don't rebuild it from scratch when migrating.
