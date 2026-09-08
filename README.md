# Cocolobo Excursion Booking System — MVP

Phase 1 of the phased build: single location, core booking flow, admin panel.
Multi-property, agent portal, waivers, promo codes, and reporting are deferred
to later phases but the data model (`locationId` on every table, `source` on
bookings, etc.) is already shaped so those phases don't require a rewrite.

## Stack

- **Frontend:** Next.js 15 (App Router, TypeScript, Tailwind) — SSR/ISR for SEO on guest-facing pages
- **Backend:** Node.js + Express + TypeScript
- **Database:** MySQL via Prisma ORM
- **Payments:** Stripe (test mode)
- **Auth:** JWT (admin/staff)

## Hosting requirements

- **Node.js hosting for two apps** — this is a Next.js frontend + separate Express backend, each a long-running Node process (not static hosting). Any host that can keep two Node processes alive works: a VPS, or shared hosting with cPanel's "Setup Node.js App" (LiteSpeed) — confirmed working there, see notes below.
- **Node.js 18+** and **MySQL 8** (or compatible, e.g. MariaDB 10.6+)
- **HTTPS on the public domain(s)** — required for Stripe/NMI's card tokenization scripts and payment webhooks to work at all
- **Outbound HTTPS access** from the server to Stripe, NMI, and your SMTP provider's APIs
- **Persistent disk storage** for `backend/uploads/` (excursion/event/rental images) — must survive redeploys, not be wiped on each `git pull`
- **SMTP credentials** (any provider) for booking confirmation and admin notification emails
- Minimum ~1GB RAM recommended — the Next.js production build is memory-hungry

If deploying to shared/CloudLinux hosting (cPanel-style), two things this project has hit in practice:
- Build with `next build --webpack` — Turbopack can fail on older host glibc versions
- Cap the build to fewer CPU threads (see `frontend/next.config.ts`) — CloudLinux's per-account process/thread limits (LVE) are often lower than Next.js's default worker-pool assumption, causing `pthread_create: Resource temporarily unavailable` otherwise

## What's built

- Guest site: excursion listing, excursion detail page (SEO metadata + JSON-LD), date/time picker with live availability, guest details, Stripe checkout, confirmation page
- Concurrency-safe booking: `SELECT ... FOR UPDATE` row locking on the departure slot inside a DB transaction — prevents overselling on simultaneous bookings
- Booking cut-off enforcement (default: 9:00 PM the evening before)
- Admin panel (`/admin`): staff login, excursion CRUD (schedule, pricing, capacity, cut-off), daily manifest view with guest list and cancellation
- Stripe webhook handling for payment confirmation + automatic capacity release on failed/cancelled payment
- Confirmation email — stubbed to console log; swap in SendGrid by implementing `sendBookingConfirmationEmail` in `backend/src/services/emailService.ts`

## Local setup

### 1. Database

Either run MySQL via Docker:

```bash
docker compose up -d
```

...or point `DATABASE_URL` in `backend/.env` at any local/hosted MySQL 8 instance.

### 2. Backend

```bash
cd backend
cp .env.example .env      # fill in DATABASE_URL, JWT_SECRET, STRIPE_SECRET_KEY
npm install
npx prisma migrate dev --name init
npm run seed               # creates a demo location, admin user, and excursion
npm run dev                 # http://localhost:4000
```

Seeded admin login: `admin@carambola.example` / `ChangeMe123!` — change this immediately outside of local dev.

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local   # fill in NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
npm install
npm run dev                          # http://localhost:3000
```

Guest site: `http://localhost:3000`
Admin panel: `http://localhost:3000/admin/login`

### 4. Stripe webhook (local dev)

```bash
stripe listen --forward-to localhost:4000/api/webhooks/stripe
```

Copy the printed webhook secret into `backend/.env` as `STRIPE_WEBHOOK_SECRET`.

## Deferred to later phases (per the requirements doc)

- Multi-property admin console, per-location branding/currency
- Travel agent/tour operator portal + commissions
- Digital waivers & e-signature
- Promo codes, seasonal pricing, add-ons
- Cancellation/refund guest-facing flow (staff-side cancel exists)
- PDF manifest export, reporting/analytics dashboard, CSV exports
- SMS notifications, reminder scheduling
- QuickBooks/Xero + POS integrations
- Role-based access beyond a single admin role (schema supports it — `AdminRole` enum already has the other roles)
