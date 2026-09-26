# StockSense: Phase Plan

> **Scope:** backend, frontend integration and production readiness.
> This is the `phases.md` that `frontend_spec.md` refers to for backend details. Its phase numbers replace the ones in `frontend_spec.md` §9, which described the original combined build order.
> **Status (26 Sep 2026, afternoon):** Phase 1 is done. The demo-critical parts of Phases 2–4 are built and tested, plus a mobile layout pass. See [Progress](#progress). Setup and deployment are in [`README.md`](README.md).

---

## Contents

1. [Where We Are](#where-we-are) · [Progress](#progress)
2. [Target Architecture](#target-architecture)
3. [Decisions to Settle First](#decisions-to-settle-first)
4. [Phase 2: Backend Foundation](#phase-2-backend-foundation)
5. [Phase 3: Inventory API](#phase-3-inventory-api)
6. [Phase 4: Frontend Integration](#phase-4-frontend-integration)
7. [Phase 5: Quality Gates & CI](#phase-5-quality-gates--ci)
8. [Phase 6: Production Hardening](#phase-6-production-hardening)
9. [Sequencing & Sizing](#sequencing--sizing)
10. [Out of Scope](#out-of-scope)
11. [Open Questions](#open-questions)

---

## Where We Are

This section records the state at the start of the day. For what has changed since, see [Progress](#progress).

| Area | State (morning of 26 Sep) |
|---|---|
| Frontend | All 16 screens built (React 19, Vite 8, Tailwind 4). Data lives in `localStorage`. `src/lib/engine.js` holds every business rule. |
| Backend | Prisma schema, the `init` migration, and Postgres 17 in `docker-compose.yml`. No server code yet. |
| Tests / CI | None. |

**Fixed on 26 Sep 2026**
- Opening any saved operation crashed with a blank page, because `OperationForm.jsx` used `isLate` without importing it.
- Routes that render the same page component kept stale state. "New" on a saved operation opened pre-filled with that operation's data, and Operations → Deliveries from the Receipts list still showed receipts. `AppLayout` now remounts the page on every path change.

**Known issues carried into this plan** (each is handled below)
- Moving a draft to another warehouse's location keeps the old reference prefix. See D6. *Now blocked on the server with a clear message; the UI still lists every warehouse's locations.*
- The dashboard's Type and Status filters only filter the Recent table. See 3.4.
- ~~The navbar's active state reads `window.location` instead of the router.~~ *Fixed.*
- Only the initial `?tab=` is read from the URL. See Phase 4.
- The production build is a single ~730 kB chunk. See Phase 6.

**Regression baseline.** With the demo seed, the prototype dashboard shows the numbers below. The backend's demo seed must produce the same numbers (test in 3.5).

| Dashboard | Value |
|---|---|
| Receipt card | 2 to receive · 1 late · 2 operations |
| Delivery card | 1 to deliver · 1 late · 1 waiting · 2 operations |
| KPIs | 6 in stock · 2 low · 1 out of stock · 1 transfer scheduled · 226 units on hand |

### Progress

**Built and tested on 26 Sep 2026**

| Phase | Done | Still open |
|---|---|---|
| 2 Foundation | ESM config and scripts; schema v2 (decimals, sessions, OTP fields, Restrict deletes, CHECK constraints, indexes); env config; error shape; bootstrap + demo seed; full auth (signup with role choice, login, logout, OTP reset via Gmail, profile, password change); Vercel config for Express | Rate limiting; `helmet`; ESLint |
| 3 Inventory API | Every `engine.js` command ported to `backend/src/inventory.ts`, running Serializable with retry; atomic references; the warehouse can't change on drafts (D6); a manager-only guard | Per-screen paginated read endpoints (the UI uses one snapshot, below); automated test suite in the repo |
| 4 Frontend integration | `lib/api.js`; `StoreProvider` swaps localStorage for the API; every change goes through `act()`; login redirects back to the page you wanted; demo-only code removed (browser seed, Reset demo data); navbar reads the router; Vite proxy + Vercel rewrite | TanStack Query, URL-synced filters, loading skeletons |
| 6 (partial) Mobile | Hamburger navigation below 900px; phones under 768px get swipeable tables and kanban, a bottom-sheet stock editor, stacked dashboard and forms, and full-width drawers | Card-list tables for tablets, focus traps |

**How Phase 4 was simplified for the deadline.** Instead of per-screen endpoints, every API response returns the whole dataset snapshot (`backend/src/snapshot.ts`) in the shape the existing selectors read. Page code barely changed, and the server still owns every rule. Moving to paginated endpoints (3.4) is the main follow-up once data grows past a few thousand operations.

**Verified.** An API test script ran 30 checks against a local Postgres on the clean demo seed, and all passed:
- the golden dashboard numbers
- decimal quantities
- double-validate rejected
- Waiting → Ready promotion when stock arrives
- two concurrent To Do requests leaving exactly one Ready
- Staff 403 on Manager actions
- duplicate signup errors
- the full OTP reset flow (wrong-code attempts, single-use token, sessions revoked)

In the browser, I also checked login redirect, validating an operation, the mobile menu, and that no page is wider than a 375px screen. Turning that script into a committed test suite is the first Phase 5 task.

**Decisions made** (see the table below for the options)
- **D1:** quantities are decimals, `Decimal(12,3)`.
- **D2:** deferred. `scheduled_date` stays a timestamp, and "late" is computed in the browser's timezone.
- **D3:** database sessions in an httpOnly cookie.
- **D4, changed:** users choose Manager or Staff at signup. Before real users, restrict Manager signup.
- **D5, D6:** as recommended. D6 is enforced on the server.
- **D7:** not yet. Products with history can't be deleted; archiving comes later.
- **D8:** Vercel (two projects: `backend/` as Express, `frontend/` as Vite) + Neon Postgres.
- **D9:** Gmail App Password via Nodemailer. Move to a transactional provider for production.

---

## Target Architecture

```
Browser: React SPA + TanStack Query
   │  fetch /api/*   (httpOnly session cookie)
   ▼
Express 5 + TypeScript
   route → zod validation → service (one DB transaction per command) → Prisma
   ▼
PostgreSQL 17   quants = current stock · stock_moves = append-only ledger
```

- **One origin.** On Vercel, `frontend/vercel.json` rewrites `/api/*` to the backend project, so the browser only sees the frontend's domain. In development, Vite proxies `/api` to Express on port 4000. With a single origin, cookie auth works without CORS or cross-site cookie settings.
- **`engine.js` is the specification.** Each function that changes data becomes one service function running in one transaction. The read helpers (`freeAt`, `onHand`, `isLate`) become SQL.
- **The server owns rules and computed values**, such as free stock, "late" and permissions. The UI displays what the server returns and does not recompute it.

---

## Decisions to Settle First

These change the schema or the API, so agree on them before Phase 2 starts.

| # | Decision | Recommendation | Why |
|---|---|---|---|
| D1 | Quantity type | `Decimal(12,3)` for operation lines, stock moves and quants | UoMs include kg, L and m, and the problem statement tracks steel in kg. The values stay well inside JSON number precision, so the API can send plain numbers. |
| D2 | Schedule date | `@db.Date` plus `APP_TIMEZONE=Asia/Kolkata` | The UI only picks a date. "Late" becomes a date comparison against today in one business timezone, done on the server. |
| D3 | Auth mechanism | Sessions stored in Postgres, with the token in an httpOnly cookie | Revocable on logout and on password change; no token-refresh logic. |
| D4 | Role on signup | First user becomes Manager, later signups are Staff, and Managers can promote | The prototype makes every signup a Manager (`Signup.jsx:22`), so anyone could edit warehouses. |
| D5 | Stock drops below a Ready operation | It stays Ready, and Validate fails with a clear message | Matches the prototype. Automatically moving it back to Waiting can come later. |
| D6 | Changing a draft's warehouse | Fix the warehouse at creation; location pickers list only that warehouse's locations | The reference (`WH/IN/0007`) encodes the warehouse, so the warehouse must not change. |
| D7 | Deleting a product that has history | Archive it (`archived_at`); hard-delete only products never used | Keeps the ledger readable. |
| D8 | Hosting | One container plus managed Postgres (Render, Railway, Fly.io or similar) | The simplest way to serve everything from one origin. |
| D9 | OTP email | SMTP via Nodemailer; in development the code is logged | Works with any email provider. |

---

## Phase 2: Backend Foundation

**Goal:** the server starts with validated config, the schema v2 migration applies, auth works end to end, and the demo seed loads.

### 2.1 Tooling & Config

- [ ] `backend/package.json`: add `"type": "module"`, which the current tsconfig (`module: nodenext` + `verbatimModuleSyntax`) requires before any `import` compiles. Remove `"main"`. Add scripts: `dev` (`tsx watch src/index.ts`), `build` (`tsc`), `start` (`node dist/index.js`), `db:migrate`, `db:deploy`, `db:seed`, `test`, `lint`, `typecheck`.
- [ ] `backend/tsconfig.json`: set `rootDir: "src"`, `outDir: "dist"` and `types: ["node"]`; remove `jsx`, `declaration` and `declarationMap`.
- [ ] Remove the `postinstall: prisma skills sync` hook and the skill folders it generated (`.agents/`, `.claude/`, `.cursor/`, `.devin/`). They are about 3,600 lines about hosted Prisma Platform, which this project doesn't use.
- [ ] Add `backend/.env.example` with `DATABASE_URL`, `PORT=4000`, `APP_ORIGIN`, `APP_TIMEZONE`, `SESSION_TTL_DAYS`, `SMTP_*`, `EXPOSE_DEV_OTP` and `SEED_DEMO`.
- [ ] Add `src/config/env.ts`: validate the environment with zod at startup, and exit with a readable message if anything is missing.
- [ ] Write the root `README.md`: prerequisites, `docker compose up -d`, backend and frontend commands, and demo logins.

### 2.2 Schema v2

Nothing is deployed yet, so regenerate the `init` migration instead of adding a second one. After the first deploy, only add new migrations.

- [ ] Change quantities to `Decimal(12,3)` (D1) and `scheduled_date` to `@db.Date` (D2).
- [ ] Make `operations.warehouse_id` NOT NULL.
- [ ] Change these relations to `onDelete: Restrict`: operation → warehouse, operation line → product, location → warehouse, quant → location. Today, deleting a warehouse deletes its operations, and deleting a product silently removes it from draft operations.
- [ ] Add columns:
  - `products`: `archived_at`, `updated_at`
  - `operations`: `updated_at`
  - `users`: `otp_attempts`, `otp_sent_at`, `reset_token_hash`, `reset_token_expires`
- [ ] Add a `sessions` table: `id` (SHA-256 of the cookie token), `user_id`, `expires_at`, `created_at`, `user_agent`.
- [ ] Add CHECK constraints by hand. Prisma can't express them, so create the migration with `prisma migrate dev --create-only`, then append:
  ```sql
  ALTER TABLE operation_lines ADD CHECK (quantity > 0);
  ALTER TABLE stock_moves     ADD CHECK (quantity > 0);
  ALTER TABLE quants          ADD CHECK (quantity >= 0);
  ALTER TABLE operations      ADD CHECK (source_loc_id <> dest_loc_id);
  ALTER TABLE products        ADD CHECK (unit_cost >= 0 AND reorder_min >= 0 AND reorder_max >= 0);
  ```
- [ ] Add indexes: `operations(type, status)`, `operations(warehouse_id)`, `operation_lines(product_id)`, `stock_moves(created_at)`, `stock_moves(operation_id)`.
- [ ] Optional: create a `stock_levels` view from the query in 3.1, so every endpoint uses one definition of free stock.

### 2.3 App Skeleton

```
backend/src/
  index.ts              start the server, graceful shutdown
  app.ts                middleware + routes
  config/env.ts
  db.ts                 PrismaClient singleton + withTx() retry helper
  lib/errors.ts         AppError + error handler
  middleware/           auth.ts (requireAuth, requireRole), validate.ts
  modules/
    auth/ products/ stock/ operations/ adjustments/ moves/ dashboard/ settings/
      routes.ts  service.ts  schemas.ts
backend/prisma/         schema.prisma, seed.ts
backend/tests/
```

- [ ] Middleware order: request ID → `pino-http` logging → `helmet` → `express.json({ limit: '100kb' })` → `cookie-parser` → session loader → routes → 404 → error handler.
- [ ] Use one error shape everywhere:
  ```json
  { "error": { "code": "INSUFFICIENT_STOCK", "message": "Only 4 Chair available at WH/Stock1.", "fields": {} } }
  ```
  Map Prisma errors as follows:

  | Prisma error | Response |
  |---|---|
  | Unique violation (P2002) | 409, naming the field |
  | Foreign-key violation (P2003) | 409 "in use" |
  | Write conflict (P2034) | Retried by `withTx`; 409 if it still fails |
- [ ] Add `GET /api/health` (the process is up) and `GET /api/ready` (the database is reachable).

### 2.4 Seed

- [ ] Split `prisma/seed.ts` into two parts:
  - **bootstrap:** creates the virtual Vendor, Customer and Inventory Loss locations. Runs in every environment, including production.
  - **demo:** a port of `frontend/src/lib/seed.js`. Runs only when `SEED_DEMO=true`. It calls the service functions instead of inserting rows, so the ledger stays consistent and the seed doubles as an integration test.

### 2.5 Auth

| Endpoint | Behaviour |
|---|---|
| `POST /api/auth/signup` | Login ID: 6–12 characters from `[A-Za-z0-9._-]`, unique. Email: unique, stored lowercase. Password: the same rules as the UI. Role per D4. Logs the user in. |
| `POST /api/auth/login` | Returns "Invalid Login ID or Password." on any failure, without saying which field was wrong. |
| `POST /api/auth/logout` | Deletes the session. |
| `GET /api/auth/me` | Returns the current user, or 401. |
| `POST /api/auth/password/forgot` | Returns the same response whether or not the account exists. |
| `POST /api/auth/password/verify` | Checks the code and returns a short-lived reset token. |
| `POST /api/auth/password/reset` | Sets the new password, clears the OTP state, and deletes all of the user's sessions. |
| `PATCH /api/me` · `POST /api/me/password` | Edit the name. Change the password (needs the current one; ends the user's other sessions). |

- [ ] Hash passwords with argon2id (for example `@node-rs/argon2`, which ships prebuilt binaries for Windows).
- [ ] Session cookie `sid`: 32 random bytes, `HttpOnly`, `SameSite=Lax`, and `Secure` in production. The database stores only its SHA-256.
- [ ] Protect against cross-site request forgery: `SameSite=Lax`, JSON-only request bodies, and an `Origin` check against `APP_ORIGIN` on every request that changes data.
- [ ] OTP rules:
  - 6 digits from `crypto.randomInt`, stored hashed
  - expires after 10 minutes
  - at most 5 attempts
  - can be resent after 30 seconds
  - logged in development; returned as `devOtp` only when `EXPOSE_DEV_OTP=true` and not in production
- [ ] Rate-limit login, forgot and verify by IP address and identifier (`express-rate-limit`).
- [ ] Apply `requireRole('MANAGER')` to warehouse and location create/edit, product archive/delete, and role changes.

---

## Phase 3: Inventory API

**Goal:** every screen's data and action comes from the API, following the same rules as `engine.js`.

### 3.1 Stock Definitions

- **On hand** at a location is `quants.quantity`. Only internal locations have quants.
- **Reserved** at a location is the total quantity on Ready deliveries and internal transfers whose source is that location.
- **Free to use** is on hand minus reserved.

```sql
SELECT COALESCE(q.product_id, r.product_id)            AS product_id,
       COALESCE(q.location_id, r.location_id)          AS location_id,
       COALESCE(q.quantity, 0)                         AS on_hand,
       COALESCE(q.quantity, 0) - COALESCE(r.reserved, 0) AS free
FROM quants q
FULL JOIN (
  SELECT ol.product_id, o.source_loc_id AS location_id, SUM(ol.quantity) AS reserved
  FROM operation_lines ol
  JOIN operations o ON o.id = ol.operation_id
  WHERE o.status = 'READY' AND o.type IN ('DELIVERY', 'INTERNAL')
  GROUP BY ol.product_id, o.source_loc_id
) r ON r.product_id = q.product_id AND r.location_id = q.location_id;
```

- **Late:** the operation is pending (Draft, Waiting or Ready) and `scheduled_date` is before today in `APP_TIMEZONE`.
- **Upcoming:** the operation is pending and `scheduled_date` is after today.

### 3.2 Commands (Ported from `engine.js`)

| `engine.js` | Endpoint | Rule |
|---|---|---|
| `createOp` | `POST /api/operations` | Creates a Draft and assigns the next reference for its warehouse and type. |
| `updateOp` | `PATCH /api/operations/:id` | Drafts only. The warehouse can't change (D6). |
| `todoOp` | `POST /api/operations/:id/todo` | A receipt becomes Ready. A delivery or transfer becomes Ready if every line is free at the source, otherwise Waiting. |
| `checkAvail` | `POST /api/operations/:id/check-availability` | Waiting operations only. |
| `validateOp` | `POST /api/operations/:id/validate` | Ready operations only. Moves the stock and writes one `stock_moves` row per line, then promotes Waiting operations in schedule order. |
| `cancelOp` | `POST /api/operations/:id/cancel` | Draft, Waiting or Ready only. Releases the reservation, then promotes Waiting operations. |
| `adjust` | `POST /api/adjustments` | The counted quantity must be ≥ 0 and differ from the recorded one. Creates a Done adjustment that moves the difference to or from Inventory Loss; the reason is stored in `note`. |
| `saveProduct` | `POST/PATCH /api/products` | SKU: 3–12 characters from `[A-Z0-9-]`, unique. Reorder max ≥ min. Initial stock is recorded as a validated "Opening stock" receipt. |
| `saveWarehouse` | `POST/PATCH /api/warehouses` | Short code: 2–5 letters or digits, unique, locked after the first operation. Creating a warehouse also creates its `<CODE>/Stock` location. |
| `saveLocation` | `POST/PATCH /api/locations` | Short code unique within its warehouse. `full_name` is `<WH>/<code>`. |

The header rules from `validateHeader` apply on create and update:
- source ≠ destination
- a schedule date is required
- receipts need "Receive From"
- deliveries need a delivery address
- each product appears at most once, with quantity > 0
- at least one line before To Do

**Status machine.** The server enforces it; any other transition returns 409.

```
Receipt:             DRAFT ─todo→ READY ─validate→ DONE
Delivery / Transfer: DRAFT ─todo→ READY (all lines free) or WAITING (a line is short)
                     WAITING ─stock arrives / check→ READY ─validate→ DONE
Any pending:         DRAFT | WAITING | READY ─cancel→ CANCELED
Adjustment:          created DONE in one step
```

### 3.3 Concurrency

- [ ] Run every command that reads stock and then writes inside `prisma.$transaction(fn, { isolationLevel: 'Serializable' })`, through a `withTx` helper that retries up to 3 times on P2034. Without this, two users clicking To Do at the same moment can both reserve the last units.
- [ ] Take reference numbers from a single atomic statement inside the same transaction:
  ```sql
  INSERT INTO operation_sequences (warehouse_id, operation_type, next_val)
  VALUES ($1, $2::"OperationType", 2)
  ON CONFLICT (warehouse_id, operation_type)
  DO UPDATE SET next_val = operation_sequences.next_val + 1
  RETURNING next_val - 1 AS n;
  ```
  Canceled drafts leave gaps in the numbering. That's expected.

### 3.4 Read Endpoints

| Endpoint | Screen | Notes |
|---|---|---|
| `GET /api/dashboard` | Dashboard | Returns the cards, KPIs, recent operations, low-stock alerts and the 7-day chart in one call. The type, status, warehouse and category filters apply to every number (the prototype applies type and status only to the Recent table). |
| `GET /api/operations` | Receipts, Deliveries, Transfers | Filters: type, status, warehouse, `q` (reference or contact), late, upcoming. Also sort, `page` and `pageSize` (default 20, max 100). Each row includes `late`. |
| `GET /api/operations/:id` | Operation form | For outgoing operations, each line includes `free` at the source location. |
| `GET /api/products` | Stock | Filters: `q` (SKU or name), category, warehouse, `lowOnly`. Each row has on hand, free, status and its reservations. |
| `GET /api/products/:id` | Product drawer | Stock by location, the reordering rule, and the last 5 moves. |
| `GET /api/products/availability?locationId=` | Product line editor | Free stock per product at one location. |
| `GET /api/moves` + `/api/moves/export.csv` | Move History | One row per operation line, in every status (the mockup shows Ready rows too). Filters: type, status, direction, product, `q`. |
| `GET /api/adjustments` | Adjustments | |
| `GET /api/warehouses` · `/api/locations` · `/api/categories` | Settings, pickers | |

- [ ] In responses, send decimals as JSON numbers, `scheduledDate` as `YYYY-MM-DD`, and timestamps in ISO 8601.

### 3.5 Tests (Written Alongside, Not After)

Use Vitest + Supertest against a real Postgres database (`stocksense_test`), truncated between test files.

- [ ] Every status transition, including invalid ones returning 409.
- [ ] To Do goes to Waiting when stock is short, and validating a receipt promotes the waiting delivery.
- [ ] Validate updates quants and writes stock moves; insufficient stock is rejected.
- [ ] Cancel releases a reservation.
- [ ] Adjustments up and down; a zero difference is rejected.
- [ ] References increment separately for each warehouse and type.
- [ ] Staff get 403 on Manager-only actions.
- [ ] Auth: login, logout, OTP expiry and attempt limit, and a password reset ending all sessions.
- [ ] **Concurrency:** two parallel To Do requests competing for the last units leave exactly one Ready.
- [ ] **Golden test:** after the demo seed, `GET /api/dashboard` returns the baseline in [Where We Are](#where-we-are).
- [ ] **Ledger integrity:** for every product and location, the stock moves add up to the quant.

---

## Phase 4: Frontend Integration

**Goal:** the frontend talks only to the API. `localStorage` keeps only UI preferences.

- [ ] Add `@tanstack/react-query`. Create `src/api/client.js`, a fetch wrapper that:
  - sends and parses JSON
  - throws an `ApiError` with `code`, `message` and `fields`
  - redirects to `/login?next=…` on 401
- [ ] In `vite.config.js`, set `server.proxy: { '/api': 'http://localhost:4000' }`.
- [ ] After any change, invalidate the `operations`, `stock`, `dashboard` and `moves` queries (spec §6.1).
- [ ] Migrate one page at a time, in this order: auth → settings → stock & products → operations → adjustments → move history → dashboard.
  - `StoreProvider` shrinks to toasts and the confirm dialog.
  - Delete the `db` state, `run()`, `lib/seed.js` and the data-changing half of `lib/engine.js` at the end. The formatters stay.
- [ ] Use the server's values (`late`, `free`, status) instead of recomputing them in the browser.
- [ ] Show server field errors under the matching `Field`.
- [ ] Add loading skeletons, an error message with Retry, and an empty state to every list (spec §6.3). These matter now that data loads asynchronously.
- [ ] Keep filters, search, view, tab and page in the URL (spec §6.2).
- [ ] Navbar: use `useLocation()` instead of `window.location`.
- [ ] Make quantity inputs follow D1: `step="0.001"`, or `step="1"` if quantities stay whole numbers.
- [ ] Remove demo-only pieces:
  - the "Reset demo data" button
  - the demo login line on the Login page (or show it only when `VITE_DEMO_MODE` is set)
  - the browser-side Dev OTP
  - `frontend/reference/`
  - the unused Vite template assets (`hero.png`, `vite.svg`, `icons.svg`)

---

## Phase 5: Quality Gates & CI

- [ ] Add ESLint + Prettier to both packages. The frontend config needs the `no-undef` and `react-hooks` rules; `no-undef` alone would have caught the `isLate` crash.
- [ ] Frontend unit tests (Vitest + Testing Library) for the short-stock logic in the product line editor and for the status bar.
- [ ] A Playwright end-to-end test of the demo script:
  1. log in
  2. create a receipt and validate it
  3. create a delivery that is short, so it waits
  4. a receipt arrives, and the delivery becomes Ready
  5. validate the delivery
  6. Move History shows the rows
  7. print
- [ ] GitHub Actions on every pull request:
  - **backend:** `npm ci`, `prisma migrate deploy` against a Postgres service, lint, typecheck, test, build
  - **frontend:** `npm ci`, lint, test, build
  - **end-to-end:** on `main`
  - `npm audit --omit=dev` fails the build on high-severity findings
- [ ] Protect `main`: changes only through pull requests, and CI must pass.

---

## Phase 6: Production Hardening

### Security
- [ ] Use `helmet` with a Content Security Policy. Either allow Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) or self-host Inter and JetBrains Mono.
- [ ] Validate every request body, query and route parameter with zod.
- [ ] Production error responses never include stack traces or raw Prisma messages.
- [ ] Keep secrets only in the host's secret store. Don't reuse the `docker-compose.yml` password anywhere shared.
- [ ] Keep the ledger append-only: the app never updates or deletes `stock_moves`. Optionally, enforce this with a database trigger.

### Reliability & Data
- [ ] Use managed Postgres with point-in-time recovery, and do one test restore.
- [ ] Releases run `prisma migrate deploy`. Never run `migrate dev` or `migrate reset` against production.
- [ ] Shut down gracefully on SIGTERM: stop accepting requests, finish the ones in flight, and disconnect Prisma.
- [ ] Run the ledger-integrity check from 3.5 nightly and alert on any mismatch.

### Observability
- [ ] Write structured JSON logs with request IDs, including business events such as "WH/OUT/0002 validated by arjunk".
- [ ] Add error tracking (for example Sentry) on the frontend and the backend.
- [ ] Add an uptime monitor on `/api/health`.

### Performance
- [ ] Split the frontend by route with `React.lazy`, loading Recharts only on the Dashboard. The current build is a single 737 kB chunk.
- [ ] Compress responses. Use long cache headers for hashed assets and `no-cache` for `index.html`.
- [ ] Paginate every list on the server (3.4), with the indexes from 2.2 in place.

### Deployment
- [ ] Write a multi-stage `Dockerfile`: build the frontend, build the backend, and run a slim Node image that serves `/api` and the static frontend, falling back to `index.html` for other paths.
- [ ] Set up three environments:
  - **local:** Docker Compose
  - **staging:** deploys automatically from `main`
  - **production:** promoted manually

### UX & Accessibility (Remaining Gaps in `frontend_spec.md`)
- [ ] Tablet layout: the navbar collapses into a drawer below 1024px, and tables become card lists (spec §8).
- [ ] Trap focus inside Drawer, Modal and ConfirmDialog, and return focus when they close.
- [ ] Remaining interaction features:
  - sortable columns and pagination controls
  - keyboard shortcuts (spec §6.4)
  - a warning before leaving with unsaved changes
  - a searchable product picker that shows free stock
- [ ] Check the print view on A4.

### Launch Checklist
- [ ] All CI checks pass on the release commit.
- [ ] Someone who didn't build the app walks through the demo script on staging.
- [ ] Backups are verified, and monitoring alerts reach a person.
- [ ] Production has no demo data, and the first Manager account exists.

---

## Sequencing & Sizing

Sizes are relative effort.

| Phase | Size | Depends on | Needed for a multi-user demo? |
|---|---|---|---|
| 2 Backend foundation | M | Decisions D1–D9 | Yes |
| 3 Inventory API | L | 2 | Yes |
| 4 Frontend integration | L | 3, page by page as endpoints land | Yes |
| 5 Quality gates & CI | M | Starts in 2 and grows with each phase | Tests yes; CI optional |
| 6 Production hardening | M | 4 | No, but required before real users |

With two people, split Phases 3 and 4 by module. For example, once `/api/warehouses` and `/api/locations` exist, the Settings pages can switch to the API while the operations endpoints are being built.

---

## Out of Scope

Purchase and sales orders, barcode scanning, lot and serial numbers, stock valuation (FIFO or average cost), multiple companies, offline mode, and languages other than English.

---

## Open Questions

- When is the demo or submission deadline? It decides whether Phase 6 happens before or after it.
- Which hosting platform and which email provider (D8, D9)?
- D1: does any product really need fractional quantities, or can everything stay whole numbers?
