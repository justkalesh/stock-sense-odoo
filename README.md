# StockSense

**Inventory management for small warehouses.** StockSense replaces paper registers and spreadsheets with one app for receiving goods, delivering orders, moving stock between locations, correcting counts, and seeing what needs attention today. It works on desktop, tablet and phone.

- **Frontend:** React 19 + Vite 8 + Tailwind 4 (`frontend/`)
- **Backend:** Express 5 + TypeScript + Prisma 6 on PostgreSQL (`backend/`)
- **Hosting:** Vercel (two projects) + Neon Postgres
- **Docs:** this README (setup, deploy, architecture), [`frontend_spec.md`](frontend_spec.md) (design system and screen specs), [`phases.md`](phases.md) (roadmap to production)

---

## Contents

1. [Features](#features)
2. [How It Works](#how-it-works)
3. [Repository Layout](#repository-layout)
4. [Run It Locally](#run-it-locally)
5. [Deploy to Vercel](#deploy-to-vercel)
6. [Environment Variables](#environment-variables)
7. [API Reference](#api-reference)
8. [Business Rules](#business-rules)
9. [Security](#security)
10. [Demo Script](#demo-script)
11. [Troubleshooting](#troubleshooting)

---

## Features

| Area | What you can do |
|---|---|
| **Accounts** | Sign up as a **Manager** or **Staff** member, sign in, reset a forgotten password with a 6-digit code sent by email, edit your name, change your password. |
| **Dashboard** | See receipts to receive, deliveries to deliver, late and waiting work, low and out-of-stock items, a 7-day in/out chart, and one-click reorder receipts. Filter by type, status, warehouse and category. |
| **Receipts** | Record goods arriving from vendors: Draft → Ready → Done. Stock increases when you validate. |
| **Deliveries** | Record goods leaving for customers: Draft → Waiting → Ready → Done. Lines short of stock turn red. A delivery waits and becomes Ready by itself when stock arrives. The Picked and Packed checklist gates Validate. |
| **Internal transfers** | Move stock between locations or warehouses. Total stock is unchanged; the location changes. |
| **Adjustments** | Fix differences between the system and a physical count, with a reason (Damaged, Lost, Found, Count correction). |
| **Stock** | On hand vs free-to-use per product. Update a count inline. A product drawer shows stock by location, the reorder rule and recent moves. Create products with optional opening stock. |
| **Move History** | The full ledger, one row per product, with incoming stock in green and outgoing in red. List or kanban view, filters, and CSV export. |
| **Settings** | Warehouses (short code drives references like `WH/IN/0001`) and locations (racks, rooms, shelves). Manager only. |
| **Print** | A goods receipt note or delivery note, once the operation is Done. |
| **Mobile** | Hamburger navigation, swipeable tables and kanban, a bottom-sheet stock editor, and stacked forms below 768px. |

---

## How It Works

```
Browser (React SPA)
   │  fetch /api/*   · httpOnly session cookie · JSON only
   ▼
Express 5 (TypeScript)                        backend/src
   routes/ → zod validation → inventory.ts (one Serializable transaction per command) → Prisma
   ▼
PostgreSQL                                    backend/prisma/schema.prisma
   quants       current stock per product per location
   stock_moves  append-only ledger (who moved what, where, when)
   operations   receipts, deliveries, transfers, adjustments + their lines
```

**One origin.** The browser only ever talks to its own origin:
- In development, Vite proxies `/api` to `localhost:4000`.
- On Vercel, `frontend/vercel.json` rewrites `/api/*` to the backend project.

With a single origin, the session cookie works without CORS or third-party cookie problems.

**Snapshots after every change.** Every API response that changes data also returns a fresh snapshot of the dataset (`backend/src/snapshot.ts`). The frontend's read-only selectors in `frontend/src/lib/engine.js` derive every screen from that snapshot. This keeps the frontend simple and always consistent, and it's fast at hackathon scale. [`phases.md`](phases.md) (Phase 3) covers the move to per-screen, paginated endpoints once data grows.

**The server owns the rules.** Stock math, status transitions, permissions and references are enforced in `backend/src/inventory.ts` and `backend/src/routes/`. The UI only mirrors them.

---

## Repository Layout

```
stock-sense/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          data model
│   │   ├── migrations/            SQL migrations, incl. CHECK constraints
│   │   └── seed.ts                system locations + optional demo data
│   ├── src/
│   │   ├── app.ts                 Express app (Vercel entrypoint)
│   │   ├── local.ts               local server (npm run dev)
│   │   ├── inventory.ts           business rules: operations, stock, products, settings
│   │   ├── routes/auth.ts         signup, login, logout, password reset (OTP)
│   │   ├── routes/data.ts         everything behind login
│   │   ├── auth.ts                sessions, password hashing, role checks
│   │   ├── snapshot.ts            dataset returned to the UI
│   │   ├── validation.ts          zod schemas for every request
│   │   ├── mail.ts                Gmail (Nodemailer) for reset codes
│   │   ├── db.ts                  Prisma client + retrying transactions
│   │   ├── errors.ts              error shape + handler
│   │   └── env.ts                 environment config
│   ├── .env.example
│   └── vercel.json
├── frontend/
│   ├── src/
│   │   ├── pages/                 one file per screen (auth, dashboard, operations, stock…)
│   │   ├── components/            ui (buttons, inputs, drawers), layout (navbar), domain (stock widgets)
│   │   ├── store/StoreProvider.jsx  session, snapshot, act() for every change, toasts
│   │   ├── lib/api.js             fetch wrapper
│   │   ├── lib/engine.js          read-only selectors (free stock, late, direction…)
│   │   └── styles/index.css       design tokens + responsive rules
│   ├── reference/                 original single-file prototype (not built)
│   ├── vercel.json                /api rewrite + SPA fallback
│   └── vite.config.js             dev proxy
├── docker-compose.yml             optional local Postgres
├── frontend_spec.md               design system & screen specification
└── phases.md                      roadmap: backend → integration → production
```

---

## Run It Locally

**Prerequisites:** Node.js 22+ and npm. Docker is optional.

### 1. Start a database (pick one)

**Option A: no Docker.** Prisma ships a local Postgres:
```bash
cd backend
npx prisma dev --name stocksense --detach
```
It prints a `postgres://…` URL. Use it in step 2, adding `&pgbouncer=true&connection_limit=1` to `DATABASE_URL`, because this local server accepts one connection.

**Option B: Docker.**
```bash
docker compose up -d
```
Then use `postgres://stocksense:stocksense@localhost:5432/stocksense` for both URLs.

### 2. Backend
```bash
cd backend
cp .env.example .env            # set DATABASE_URL and DATABASE_URL_UNPOOLED; SEED_DEMO=true for demo data
npm install
npm run db:migrate              # applies prisma/migrations
npm run db:seed                 # system locations (+ demo data when SEED_DEMO=true)
npm run dev                     # http://localhost:4000/api/health
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

**Demo logins** (created by the demo seed):

| Login ID | Password | Role |
|---|---|---|
| `arjunk` | `Admin@123` | Manager |
| `priyas` | `Staff@123` | Staff |

To start again from clean demo data, run `npx prisma migrate reset` in `backend/` and then `npm run db:seed`. This deletes all local data.

### Scripts

| Where | Command | What it does |
|---|---|---|
| backend | `npm run dev` | API with reload on save |
| backend | `npm run typecheck` | TypeScript check |
| backend | `npm run db:migrate` | Apply migrations |
| backend | `npm run db:seed` | Seed system locations (+ demo data) |
| backend | `npm run vercel-build` | What Vercel runs: generate client, migrate, seed |
| frontend | `npm run dev` | Vite dev server with `/api` proxy |
| frontend | `npm run build` | Production build to `frontend/dist` |

---

## Deploy to Vercel

The app deploys as **two Vercel projects from the same repo**: the API and the website. The website forwards `/api` to the API, so users only ever see one domain.

### 0. Push the repo to GitHub

### 1. Create the backend project
1. In Vercel, go to **Add New → Project**, import the repo, and set **Root Directory** to `backend`. The framework preset should show **Express**; if it doesn't, choose it.
2. Go to **Storage → Create Database → Neon (Postgres)** and connect it to this project. This adds `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct) for every environment.
3. Under **Settings → Environment Variables**, add:
   - `GMAIL_USER`: the Gmail address that sends reset codes
   - `GMAIL_APP_PASSWORD`: its App Password (see below)
   - `SEED_DEMO`: `true`, if you want the demo users and data
   - `EXPOSE_DEV_OTP`: optional `true`, which shows reset codes on screen if email isn't set up. Remove it before real users.
4. Deploy. The build runs `prisma migrate deploy` and the seed.
5. Check `https://<backend-project>.vercel.app/api/health`. It should return `{"ok":true}`.

### 2. Point the frontend at the backend
In [`frontend/vercel.json`](frontend/vercel.json), replace `YOUR-BACKEND-PROJECT` with the backend's domain, then commit and push:
```json
{ "source": "/api/:path*", "destination": "https://<backend-project>.vercel.app/api/:path*" }
```

### 3. Create the frontend project
1. Go to **Add New → Project**, import the same repo, and set **Root Directory** to `frontend`. The preset should be **Vite**.
2. Deploy, then open the frontend URL and sign in.

### Gmail App Password (for reset emails)
1. Turn on **2-Step Verification** for the Google account.
2. Open <https://myaccount.google.com/apppasswords>, create an app password named "StockSense", and copy the 16 characters without spaces.
3. Put it in `GMAIL_APP_PASSWORD`, and the address in `GMAIL_USER`.

Gmail allows about 500 emails a day, which is plenty for a demo. For production, switch `backend/src/mail.ts` to a transactional provider (Resend, Postmark, SES) with your own domain.

---

## Environment Variables

All of these belong to the backend. The frontend needs none.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Pooled Postgres URL used at runtime. On Neon, `pgbouncer=true` is added automatically. |
| `DATABASE_URL_UNPOOLED` | Yes | Direct Postgres URL, used by migrations |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | For email | Sends reset codes. If unset, codes are printed to the server log. |
| `EXPOSE_DEV_OTP` | No | `true` returns the reset code to the browser. For demos only. |
| `SEED_DEMO` | No | `true` creates demo data on seed. Skipped once any user exists. |
| `PORT` | No | Local API port (default 4000) |

---

## API Reference

Every endpoint lives under `/api`. Requests that change data must send `Content-Type: application/json`.

Errors look like this:
```json
{ "error": { "code": "INSUFFICIENT_STOCK", "message": "Insufficient stock for Chair at WH/Stock1", "fields": {} } }
```

**Auth** (no login needed)

| Method | Path | Body |
|---|---|---|
| POST | `/auth/signup` | `loginId, email, password, role` (`MANAGER` or `STAFF`) |
| POST | `/auth/login` | `loginId, password` |
| POST | `/auth/logout` | |
| POST | `/auth/password/forgot` | `identifier` (email or Login ID). The response is the same whether or not the account exists. |
| POST | `/auth/password/verify` | `identifier, code`. Returns `resetToken`. |
| POST | `/auth/password/reset` | `resetToken, password`. Signs out every device. |

**Data** (login needed). Every response returns `{ res, me, db }`, where `db` is the fresh snapshot.

| Method | Path | Notes |
|---|---|---|
| GET | `/bootstrap` | Current user + snapshot |
| PATCH | `/me` | `name` |
| POST | `/me/password` | `current, next`. Signs out other devices. |
| POST | `/operations` | Create a draft. Add `todo: true` to mark it To Do in the same transaction. |
| PATCH | `/operations/:id` | Edit a draft (optional `todo: true`) |
| POST | `/operations/:id/validate` | Ready → Done: moves stock and promotes Waiting operations |
| POST | `/operations/:id/check` | Re-check a Waiting operation |
| POST | `/operations/:id/cancel` | Releases any reservation |
| POST | `/adjustments` | `productId, locationId, counted, reason` |
| POST / PATCH | `/products`, `/products/:id` | Includes optional opening stock on create |
| PATCH | `/products/:id/reorder` | `min, max` |
| DELETE | `/products/:id` | Manager; only products with no history |
| POST / PATCH | `/warehouses`, `/warehouses/:id` | Manager |
| POST / PATCH | `/locations`, `/locations/:id` | Manager |
| GET | `/health` | No login; returns `{ ok: true }` |

---

## Business Rules

- **Locations.** Stock only lives in *internal* locations (for example `WH/Stock1`). **Vendor**, **Customer** and **Inventory Loss** are virtual locations, so every movement has both a source and a destination, and the ledger always balances.
- **Statuses:**
  ```
  Receipt:             Draft ─To Do→ Ready ─Validate→ Done
  Delivery / Transfer: Draft ─To Do→ Ready (all stock free) or Waiting (short)
                       Waiting ─stock arrives / Check Availability→ Ready ─Validate→ Done
  Any pending:         Draft | Waiting | Ready ─Cancel→ Canceled
  Adjustment:          created Done in one step
  ```
- **Free to use** = on hand − stock reserved by Ready deliveries and transfers leaving that location. Waiting operations don't reserve.
- **Validate** re-checks on-hand stock, moves it, writes one ledger row per line, and promotes Waiting operations in schedule order.
- **References** are `<warehouse code>/<IN|OUT|INT|ADJ>/<0001…>`, numbered per warehouse and type. A draft can't move to another warehouse, because its reference names the warehouse.
- **Concurrency.** Commands that check stock run as Serializable transactions and retry on conflict. Two people can't both reserve the last units.
- **Quantities** allow up to 3 decimals (kg, L, m). Postgres CHECK constraints stop negative stock and zero-quantity lines even if the app has a bug.
- **Roles.** Managers can also manage warehouses and locations and delete unused products. Staff see those actions disabled with an explanation.

---

## Security

- **Passwords:** hashed with bcrypt, with the same rules on client and server (8+ characters, lowercase, uppercase, special character).
- **Sessions:** a random 32-byte token in an `HttpOnly`, `SameSite=Lax` cookie (`Secure` in production). Only its SHA-256 hash is stored. Logout, password change and password reset revoke sessions.
- **Cross-site request forgery (CSRF):** besides the `SameSite` cookie, every request that changes data must be JSON, which HTML forms can't send.
- **Reset codes:**
  - hashed
  - expire after 10 minutes
  - 5 attempts
  - can be resent after 30 seconds
  - the same response whether or not the account exists, so it can't be used to discover accounts
- **Validation:** zod checks every request, and error responses never include stack traces or database messages.
- **Known gaps:** see [`phases.md`](phases.md) Phase 6. They include rate limiting, security headers (helmet/CSP), audit logging and moving off Gmail.

> **Note:** Anyone can currently sign up as a Manager, as requested for the demo. For real use, restrict Manager signup (for example, first user only, or promotion by an existing Manager).

---

## Demo Script

About five minutes:

1. **Sign in** as `arjunk`. A low-stock toast appears.
2. **Dashboard:** point out the Receipt and Delivery cards (late, waiting, operations) and the KPIs. Filter by warehouse.
3. **Deliveries:** open the Waiting delivery for Sharma & Co. The Chair line is red ("Short by 6").
4. **Receipts → New:** receive 10 Chairs into `WH/Stock1`, then To Do → Validate. A toast shows the Sharma delivery is now Ready.
5. **Open that delivery:** tick Picked and Packed → Validate → Print the delivery note.
6. **Move History:** the new rows appear, with incoming in green and outgoing in red. Switch to kanban and export CSV.
7. **Stock:** tap the pencil on Steel Rods and count 35 kg. It's logged as a `WH/ADJ/…` adjustment.
8. **Settings:** add a location `WH/RackB`. Then log in as `priyas` (Staff) to show that settings are read-only.
9. **Phone:** open the site on a phone to show the hamburger menu and swipeable tables.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Frontend loads but every action fails, or login loops | `frontend/vercel.json` still has `YOUR-BACKEND-PROJECT`, or points at the wrong domain. |
| `/api/health` works but pages show "Please sign in again" | You opened the backend URL directly. Use the frontend URL; the cookie belongs to that domain. |
| Build fails at `prisma migrate deploy` | `DATABASE_URL_UNPOOLED` is missing. Connect Neon to the backend project, or set it by hand. |
| `prepared statement "s0" already exists` | The pooled URL needs `pgbouncer=true`. It's added automatically for Neon `-pooler` hosts; add it by hand for other poolers. |
| Reset email never arrives | Check `GMAIL_USER` and `GMAIL_APP_PASSWORD` (an app password, not your normal password), then check the Vercel function logs. |
| "System location VENDOR is missing" | Run the seed (`npm run db:seed`). It creates the Vendor, Customer and Inventory Loss locations. |
