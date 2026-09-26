# StockSense — Frontend (As-Built Documentation)

> **Last updated:** 2026-09-26 · Generated from source code, not from the spec.

---

## 1. Overview

**StockSense** is a warehouse inventory management system inspired by Odoo, built for a hackathon. It tracks stock receipts, deliveries, internal transfers, and adjustments with full state-machine workflows and real-time quantity tracking.

**Current status:** Frontend is **complete on mock data** (localStorage). The backend (Prisma schema committed) is **not yet connected**. All business logic runs client-side in `engine.js`.

---

## 2. Quick Start

```bash
cd frontend
npm install          # install dependencies
npm run dev          # Vite dev server → http://localhost:5173
npm run build        # production build → dist/
npm run preview      # preview the production build
```

| Requirement | Value |
|---|---|
| Node | v26.3.0 (tested) |
| Package manager | npm (lockfile committed) |

### Demo credentials

| Login ID | Password | Role |
|---|---|---|
| `arjunk` | `Admin@123` | Manager |
| `priyas` | `Staff@123` | Staff |

Credentials are shown on the login page in a small mono footer.

### Reset demo data

On the **Profile** page there is a **"Reset demo data"** button. It calls `resetDemo()` which rebuilds `buildSeed()`, clears the current user, and persists to localStorage.

### localStorage key

`stocksense:v1` — stores `{ db, uid }` as JSON. On load, if the key is missing or the stored user doesn't exist, the app falls back to `buildSeed()`.

---

## 3. Tech Stack

| Package | Version | Purpose |
|---|---|---|
| `react` | ^19.2.8 | UI framework |
| `react-dom` | ^19.2.8 | DOM renderer |
| `react-router-dom` | ^7.18.4 | Client-side routing |
| `recharts` | ^3.10.1 | Bar chart on Dashboard (Stock In vs Out) |
| `lucide-react` | ^1.48.0 | Icon library (all icons) |
| `tailwindcss` | ^4.3.3 | Utility classes (flex, grid, gap, etc.) |
| `@tailwindcss/vite` | ^4.3.3 | Tailwind v4 Vite plugin |
| `@vitejs/plugin-react` | ^6.1.1 | React JSX transform (dev dep) |
| `vite` | ^8.3.0 | Build tool / dev server (dev dep) |

> **Note:** Tailwind v4 is used with the Vite plugin. There is no `tailwind.config.js` — tokens are defined as CSS custom properties in `index.css` under `.ss`, not as Tailwind theme extensions.

---

## 4. Folder Structure

```
src/
├── main.jsx                          # ReactDOM entry, wraps App in BrowserRouter + StoreProvider
├── App.jsx                           # Route definitions, ProtectedRoute / GuestRoute guards
├── assets/
│   ├── hero.png                      # Hero image (unused in current pages)
│   └── vite.svg                      # Vite logo (unused)
├── components/
│   ├── domain/
│   │   └── index.jsx                 # Business components: StatusBar, OpCard, Kpi, LineEditor,
│   │                                 #   StockPopover, ProductDrawer, ProductModal, AdjustDrawer,
│   │                                 #   WarehouseDrawer, LocationDrawer
│   ├── layout/
│   │   └── index.jsx                 # Navbar, PageHeader, AuthShell, SettingsLayout, AppLayout
│   └── ui/
│       └── index.jsx                 # Generic UI: Badge, Pill, LateTag, PName, Diamond, Field,
│                                     #   ReadVal, PwInput, PW_RULES, pwOk, RuleList, Drawer, Modal,
│                                     #   ConfirmDialog, Dropdown, Empty, SearchBox, ViewToggle,
│                                     #   ChipSelect, Toasts
├── hooks/
│   ├── useEsc.js                     # Calls callback on Escape keydown
│   ├── useGo.js                      # Navigation helper: go(name, params) → react-router navigate
│   └── useOutside.js                 # Calls callback on click outside a ref
├── lib/
│   ├── constants.js                  # COL, STATUS, TYPE_CODE, TYPE_LABEL, PENDING, UOMS, MON, WD, WDL, DAY
│   ├── engine.js                     # Mock backend: selectors + mutations (createOp, validateOp, etc.)
│   ├── format.js                     # Date/currency/quantity formatters, initials()
│   └── seed.js                       # buildSeed(): creates demo db with users, warehouses, products, operations
├── pages/
│   ├── auth/
│   │   ├── Login.jsx                 # Login form
│   │   ├── Signup.jsx                # Registration form with password rules
│   │   └── ForgotPassword.jsx        # 3-step OTP flow (email → verify → new password)
│   ├── operations/
│   │   ├── OperationList.jsx         # Tabbed list + kanban view for Receipts/Deliveries/Internal
│   │   ├── OperationForm.jsx         # Create/view/edit a single operation with status actions
│   │   └── PrintView.jsx            # Print-optimised document (light theme, only for DONE ops)
│   ├── settings/
│   │   ├── Warehouses.jsx            # CRUD table for warehouses (Manager only)
│   │   └── Locations.jsx             # CRUD table for locations (Manager only)
│   ├── Adjustments.jsx               # Adjustment log + AdjustDrawer for new adjustments
│   ├── Dashboard.jsx                 # KPIs, receipt/delivery cards, recent ops table, low stock, chart
│   ├── MoveHistory.jsx               # All operations flat-listed by product line, CSV export
│   ├── NotFound.jsx                  # 404 page
│   ├── Profile.jsx                   # Name edit, change password, logout, reset demo data
│   └── Stock.jsx                     # Product table with inline stock popover, product drawer/modal
└── store/
    └── StoreProvider.jsx             # React context: db state, run(), toast(), login/logout, resetDemo
└── styles/
    └── index.css                     # Tailwind import + all design tokens + custom CSS classes
```

---

## 5. Architecture

### Data flow

```
StoreProvider (React Context)
    ├── db: full in-memory database object
    ├── run(fn): clone db → fn(clone) → commit clone → persist to localStorage
    │            throws? → catch → toast(error, "error")
    ├── toast(msg, kind): push notification, auto-dismiss (4s success, 6s error)
    ├── login(user): set uid, persist, show welcome + low stock count
    ├── logout(): clear uid, persist
    ├── ask(dlg): open ConfirmDialog
    └── resetDemo(): rebuild from buildSeed(), clear uid
```

Every mutation uses `run()` which calls `structuredClone(db)` before mutating, so failed mutations don't corrupt state. On success, the cloned-and-mutated db is committed via `setDb()` and persisted to localStorage.

### engine.js — the mock backend

All stock changes go through `engine.js`. Key functions:

| Function | Purpose |
|---|---|
| `createOp(db, data, userId)` | Validate header, insert operation as DRAFT |
| `updateOp(db, id, data)` | Edit a DRAFT operation |
| `todoOp(db, id)` | DRAFT → READY (receipts, or if stock available) or WAITING |
| `validateOp(db, id, userId, at)` | READY → DONE: move quants, create move records, recheck waiting |
| `cancelOp(db, id)` | DRAFT/WAITING/READY → CANCELED, recheck waiting |
| `checkAvail(db, id)` | Re-check a WAITING op; promote to READY if stock available |
| `recheckWaiting(db)` | Auto-promote all WAITING ops that now have stock |
| `adjust(db, data, userId, at)` | Create + immediately validate an adjustment operation |
| `saveProduct(db, data, userId)` | Create/edit product; optionally create initial stock receipt |
| `saveWarehouse(db, data)` | Create/edit warehouse; auto-creates Stock location for new |
| `saveLocation(db, data)` | Create/edit internal location |
| `validateHeader(data)` | Shared validation for operations |

### Routing

Uses `react-router-dom` v7 with `BrowserRouter`.

- **`useGo()`** hook wraps `navigate()` with a name-based route map. Components call `go("opList", { type: "RECEIPT", preset: "READY" })` instead of raw paths.
- **ProtectedRoute**: redirects to `/login` if no user.
- **GuestRoute**: redirects to `/` if already logged in.
- **Query params** used for: `?tab=` (operation list preset), `?low=1` (stock filter), `?product=` (move history filter).
- **Navigate state** used for: `prefill` lines when creating an operation from low stock alerts.

### Persistence

- Key: `stocksense:v1`
- On load: try `JSON.parse(localStorage.getItem(key))` → validate `db` and `uid` exist and user is still in the users array → fallback to `buildSeed()`.
- On every `run()`, `login()`, `logout()`, `resetDemo()`: `JSON.stringify({ db, uid })` → `localStorage.setItem(key)`.
- No versioning migration — if the schema changes, the old key is silently discarded.

---

## 6. Routes

| Path | Page | Access | Query params / state |
|---|---|---|---|
| `/login` | Login | Guest only | — |
| `/signup` | Signup | Guest only | — |
| `/forgot-password` | ForgotPassword | Guest only | — |
| `/` | Dashboard | Protected | — |
| `/receipts` | OperationList (RECEIPT) | Protected | `?tab=` preset (ALL, DRAFT, READY, DONE, LATE, UPCOMING) |
| `/receipts/new` | OperationForm (new RECEIPT) | Protected | state: `{ prefill: [{productId, quantity}] }` |
| `/deliveries` | OperationList (DELIVERY) | Protected | `?tab=` preset |
| `/deliveries/new` | OperationForm (new DELIVERY) | Protected | state: `{ prefill }` |
| `/internal` | OperationList (INTERNAL) | Protected | `?tab=` preset |
| `/internal/new` | OperationForm (new INTERNAL) | Protected | — |
| `/operations/:id` | OperationForm (edit/view) | Protected | — |
| `/operations/:id/print` | PrintView | Protected | — |
| `/adjustments` | Adjustments | Protected | — |
| `/stock` | Stock | Protected | `?low=1` to filter low/out of stock |
| `/move-history` | MoveHistory | Protected | `?product=` product ID filter |
| `/settings/warehouses` | Warehouses | Protected | — |
| `/settings/locations` | Locations | Protected | — |
| `/profile` | Profile | Protected | — |
| `*` | NotFound | Protected | — |

---

## 7. Business Rules Implemented

### 7.1 Operation types

| Type | Source | Destination | Contact field |
|---|---|---|---|
| RECEIPT | Virtual: Vendor (id 90) | Internal location | `contact` (required, "Receive From") |
| DELIVERY | Internal location | Virtual: Customer (id 91) | `deliveryAddress` (required), `contact` (optional) |
| INTERNAL | Internal location | Internal location (different) | `contact` (optional, "Reference note") |
| ADJUSTMENT | Internal ↔ Virtual: Loss (id 92) | Auto-determined by diff | `note` (reason) |

### 7.2 State machines

**Receipt:** `DRAFT → READY → DONE` (no WAITING — receipts are always available)

**Delivery / Internal:** `DRAFT → WAITING or READY → DONE`
- If all line quantities are available at source → READY
- Otherwise → WAITING

**Cancel:** Any PENDING status (`DRAFT`, `WAITING`, `READY`) → `CANCELED`

**Adjustment:** Created and immediately validated in one `adjust()` call — goes `DRAFT → READY → DONE` atomically.

### 7.3 Reference format

`<WH short code>/<TYPE_CODE>/<sequence>`

| Type | Code |
|---|---|
| RECEIPT | `IN` |
| DELIVERY | `OUT` |
| INTERNAL | `INT` |
| ADJUSTMENT | `ADJ` |

Sequence: 4-digit zero-padded, per-warehouse per-type. Key `db.seq["whId:type"]` incremented on each `nextRef()`.

Example: `WH/IN/0001`, `WH/OUT/0002`, `WH2/INT/0001`

### 7.4 Stock quantities

| Metric | Computation |
|---|---|
| **On Hand** | Sum of `db.quants[productId:locationId]` across all INTERNAL locations (optionally filtered by warehouse) |
| **Reserved** | Sum of quantities in READY outgoing ops (DELIVERY or INTERNAL) at a specific location, excluding current op |
| **Free to Use** | On Hand − Reserved |

### 7.5 Auto-promotion of WAITING operations

After every `validateOp()` or `cancelOp()`, `recheckWaiting(db)` runs. It iterates all WAITING operations sorted by `scheduledDate` and promotes any that now have sufficient stock to READY. The promoted references are shown in a toast.

### 7.6 Adjustments

User enters a **counted quantity**. The system computes `diff = counted − current`. If diff > 0, stock moves from Inventory Loss → location; if diff < 0, from location → Inventory Loss. The adjustment operation is created and validated atomically.

### 7.7 Dashboard KPIs

| KPI | Definition |
|---|---|
| To receive | READY receipts count |
| Late | Pending ops with `scheduledDate < startOfToday()` |
| Waiting | DELIVERY ops with status WAITING |
| Operations (upcoming) | Pending ops with `scheduledDate >= startOfToday() + 1 day` |
| Products in stock | Products with on hand > 0 |
| Low stock | Products with on hand > 0 AND free to use ≤ reorderMin |
| Out of stock | Products with on hand ≤ 0 |
| Transfers scheduled | INTERNAL ops in any PENDING status |
| Total units on hand | Sum of on hand across all products |

### 7.8 Validation rules and error messages

**Sign-up:**
- Login ID: 6–12 chars, `[A-Za-z0-9._-]` only → `"Login ID must be 6–12 characters"`
- Email: basic `^\S+@\S+\.\S+$` → `"Enter a valid email"`
- Password: 8+ chars, 1 lowercase, 1 uppercase, 1 special → `"Complete all password rules"`
- Confirm: must match → `"Passwords must match"` / `"Passwords don't match"`
- Duplicate login ID → `"This Login ID is taken."`
- Duplicate email → `"This email is already registered."`

**Product:**
- Name required → `"Name is required"`
- SKU: `^[A-Z0-9-]{3,12}$` → `"SKU must be 3–12 letters, numbers or dashes"`
- Duplicate SKU → `"SKU ${sku} already exists"`
- Negative costs/min/max → `"Values cannot be negative"`
- Max < min → `"Reorder max must be at least the min"`
- Negative initial stock → `"Initial stock cannot be negative"`

**Warehouse:**
- Name required → `"Name is required"`
- Short code: `^[A-Z0-9]{2,5}$` → `"Short code must be 2–5 letters or numbers"`
- Duplicate short code → `"Short code ${code} is already used"`
- Code change after ops → `"Short code can't change after the first operation"`

**Location:**
- Name required → `"Name is required"`
- Short code: `^[A-Za-z0-9-]{2,12}$` → `"Short code must be 2–12 letters, numbers or dashes"`
- Warehouse required → `"Select a warehouse"`
- Duplicate in warehouse → `"${wh.shortCode}/${code} already exists"`

**Operations:**
- Same source/dest → `"Source and destination must be different"`
- No date → `"Schedule date is required"`
- Receipt without contact → `"Receive From is required"`
- Delivery without address → `"Delivery address is required"`
- Empty product line → `"Select a product on every line"`
- Zero/negative qty → `"Quantities must be greater than 0"`
- Duplicate product → `"Each product can appear only once"`
- No lines on To Do → `"Add at least one product"`
- Insufficient stock → `"Insufficient stock for ${name} at ${location}"`
- Validate non-READY → `"Cannot validate a ${status} operation"`
- Edit non-DRAFT → `"Only draft operations can be edited"`

### 7.9 Permissions (Manager vs Staff)

| Action | Manager | Staff |
|---|---|---|
| Create/edit operations | ✓ | ✓ |
| Create/edit products | ✓ | ✓ |
| Create/edit warehouses | ✓ | ✗ (button disabled, tooltip) |
| Create/edit locations | ✓ | ✗ (button disabled, tooltip) |
| Delete product | ✓ (if no history) | ✗ |
| All other actions | ✓ | ✓ |

> **Note:** New sign-ups are always created with role `MANAGER`. There is no UI to change roles.

---

## 8. Screens & Features

### Login (`/login`)
- Fields: Login ID, Password (with show/hide toggle)
- Error banner on invalid credentials: `"Invalid Login ID or Password."`
- Links to Forgot Password and Sign Up
- Demo credentials in mono footer
- 300ms simulated delay on submit

### Signup (`/signup`)
- Fields: Login ID (with char counter 0/12), Email, Password, Confirm Password
- Real-time password rule checklist (4 rules with ✓/✗)
- Duplicate detection for login ID and email
- Auto-login on success → redirect to Dashboard

### Forgot Password (`/forgot-password`)
- 3-step wizard with progress indicator (Email → Verify → New password)
- Step 1: enter email or login ID → generates a 6-digit OTP
- Step 2: 6-digit OTP input with auto-advance, expiry countdown (10 min), resend cooldown (30s), 3 attempts, shake animation on wrong code. Dev OTP displayed for testing.
- Step 3: new password + confirm with rule checklist

### Dashboard (`/`)
- PageHeader with day name and formatted date
- Warehouse filter (ChipSelect)
- Filter bar: Type, Status, Category, Search, "Clear all"
- 2 OpCards: Receipt (to receive, late, operations) and Delivery (to deliver, late, waiting, operations)
- 5 KPI tiles: Products in stock, Low stock, Out of stock, Transfers scheduled, Total units
- Recent Operations table (top 8, clickable rows)
- Low Stock Alerts panel (top 5, with progress bars and "Create receipt" button for reorder)
- Stock In vs Out bar chart (Recharts, last 7 days)

### Operation List (`/receipts`, `/deliveries`, `/internal`)
- List view: tabbed table (All, Draft, [Waiting], Ready, Done, Late, Upcoming) with counts
- Kanban view: columns by status with status-colored cards
- Segmented control for Delivery ↔ Internal (on delivery list page)
- Warehouse filter, search, "Show canceled" toggle (kanban only)
- Empty states with contextual messages and "New" action

### Operation Form (`/receipts/new`, `/deliveries/new`, `/internal/new`, `/operations/:id`)
- Breadcrumb: `Receipts / WH/IN/0001`
- Status-dependent action bar: To Do, Validate, Check Availability, Print, Cancel/Discard, Save draft
- StatusBar component showing progress through states
- Header fields vary by type (contact, address, locations, date, responsible)
- LineEditor: product select, quantity input, free-to-use column for outgoing ops
- Short-stock warnings (banner + per-line highlight)
- Picked/Packed checkboxes for deliveries (must tick both to Validate)
- Confirm dialog before Validate and Cancel
- Auto-promotion toast after validation

### Print View (`/operations/:id/print`)
- Light-themed document (`doc` class, white background)
- Shows company name, warehouse address, reference, status badge
- Metadata grid: contact, from/to, dates, responsible
- Product line table
- Signature lines: "Delivered by" / "Received by"
- Back button + Print button (calls `window.print()`)
- Only available for DONE operations; empty state otherwise

### Adjustments (`/adjustments`)
- Table of past adjustments: reference, date, product, location, Δ qty (colored), reason, user
- AdjustDrawer (slide-in panel): select product → location → enter counted qty → see recorded vs counted → preview diff → apply
- Reason dropdown: Damaged, Lost, Found, Count correction

### Stock (`/stock`)
- Product table: Product, Category, UoM, Per Unit Cost, On Hand (with inline edit pencil), Free to Use, Status pill
- StockPopover: click pencil → popover with location select, counted qty, diff preview → Update
- ProductDrawer: click row → slide-in with stock by location, reorder rule editor, recent moves (5), View all → link, Edit/Delete buttons
- ProductModal: create/edit product with all fields, category dropdown with "+ New category" option, initial stock (new only)
- Filters: search, category, warehouse, "Low stock only" checkbox
- Summary: X products · Y units on hand · ₹Z stock value

### Move History (`/move-history`)
- Flat list of all operations × their product lines
- List and Kanban views
- Filters: Type, Status, Direction (In/Out/Internal), product chip filter
- Direction color legend (In=green, Out=red, Internal=gray)
- CSV export button
- Product filter via `?product=` query param

### Settings → Warehouses (`/settings/warehouses`)
- SettingsLayout with left sidebar (Warehouse, Location)
- Table: Name, Short Code, Address, Locations count
- WarehouseDrawer: name, short code (locked after first op), address, reference preview
- Manager only — Staff sees disabled buttons with tooltip

### Settings → Locations (`/settings/locations`)
- Table: Full Name, Name, Short Code, Warehouse, Type (Internal/Virtual)
- Virtual locations (Vendor, Customer, Loss) shown dimmed with lock icon, read-only
- LocationDrawer: name, short code, warehouse select, full name preview
- Manager only for editing

### Profile (`/profile`)
- Avatar with initials, name (editable), role badge, member since date
- Login ID (locked), Email
- Change Password form: current password, new password with rules, confirm
- Logout button, Reset demo data button

### 404 (`*`)
- PackageX icon, "404", "This shelf is empty.", "Back to Dashboard" button

---

## 9. Design System

### Color tokens (from `index.css` `.ss` rule)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0F0F10` | App background |
| `--s1` | `#17171A` | Cards, navbar (surface 1) |
| `--s2` | `#1F1F23` | Inputs, hover rows (surface 2) |
| `--s3` | `#27272C` | Modals, drawers (surface 3) |
| `--b` | `#2A2A30` | Border |
| `--b2` | `#3A3A42` | Strong border (inputs, focus) |
| `--t` | `#EDEDEF` | Primary text |
| `--t2` | `#A1A1AA` | Secondary text |
| `--t3` | `#71717A` | Placeholder, disabled |
| `--ac` | `#F47272` | Accent (coral) |
| `--ach` | `#F68A8A` | Accent hover |
| `--acp` | `#E05A5A` | Accent pressed |
| `--acs` | `rgba(244,114,114,.12)` | Accent soft (tint) |
| `--red` | `#FF5C5C` | Error, out-of-stock, late, stock out |
| `--green` | `#2FBF71` | Success, done, stock in |
| `--amber` | `#F5A524` | Warning, waiting, low stock |
| `--blue` | `#4C8DFF` | Ready, manager badge |

### Fonts

- **Inter** (400, 500, 600) — body, headings, labels
- **JetBrains Mono** (400, 500, 600) — references, SKUs, quantities, currency
- Loaded via Google Fonts in `index.html`

### Spacing & radius

- 4px grid (4, 8, 12, 16, 24, 32)
- Buttons/inputs: `border-radius: 8px`
- Cards/modals: `border-radius: 12px`
- Badges/pills: `border-radius: 999px`

### Status colors (from `constants.js STATUS`)

| Status | Color | Badge bg |
|---|---|---|
| DRAFT | `#8B8B94` | `#8B8B941F` |
| WAITING | `#F5A524` | `#F5A5241F` |
| READY | `#4C8DFF` | `#4C8DFF1F` |
| DONE | `#2FBF71` | `#2FBF711F` |
| CANCELED | `#8B8B94` text, `#5C5C6640` bg | — |

### Direction colors (from `engine.js DIR_COLOR`)

| Direction | Color |
|---|---|
| IN | `#2FBF71` (green) |
| OUT | `#FF5C5C` (red) |
| INT | `#A1A1AA` (t2) |

### Key CSS classes

| Class | Purpose |
|---|---|
| `.ss` | Root scope — all tokens, base styles |
| `.btn` | Base button (36px height) |
| `.bp` | Primary button (coral bg, dark text) |
| `.bs` | Secondary button (surface bg, border) |
| `.bd` | Danger button (red outline) |
| `.bg` | Ghost button (transparent) |
| `.bo` | Outline button (coral border) |
| `.blg` | Large button (44px height) |
| `.bsm` | Small button (30px height) |
| `.ibtn` | Icon button (32×32, borderless) |
| `.inp` | Input field (36px height, surface bg) |
| `.badge` | Status/category badge (pill with dot) |
| `.tbl` | Table styles |
| `.card` | Card container (surface bg, border, 12px radius) |
| `.card-h` | Card header (with bottom border) |
| `.nav` | Navbar (56px, sticky top) |
| `.navl` | Nav link (with active state `.on`) |
| `.menu` | Dropdown menu |
| `.mi` | Menu item |
| `.seg` | Segmented control container |
| `.tabs` / `.tab` | Tab bar / tab button |
| `.drawer` | Slide-in panel (480px, right) |
| `.modal` | Centered modal (540px) |
| `.scrim` | Modal backdrop |
| `.toast` / `.toasts` | Toast notifications (fixed top-right) |
| `.late` | Late tag (red pill) |
| `.banner` | Alert banner (`.warn`, `.err`, `.info` variants) |
| `.lnk` / `.lnk2` | Link buttons (accent / muted) |
| `.bar` | Progress bar |
| `.otp` | OTP digit input |
| `.glow` | Login page radial gradient backdrop |
| `.doc` | Print view (white bg, dark text) |
| `.mono` | Monospace font class |
| `.t2` / `.t3` | Text color utility classes |
| `.upper` | Uppercase label (12px, tracking) |
| `.h-title` / `.h-sec` | Heading sizes (20px / 16px) |
| `.srch` | Search input with icon |
| `.kcard` / `.kcol` | Kanban card / column |
| `.cb` | Checkbox (coral accent) |
| `.cnt` | Count badge (small pill) |
| `.lbl` | Form label |

---

## 10. Component Catalog

### UI Components (`components/ui/index.jsx`)

| Component | Props | Used by |
|---|---|---|
| `Badge` | `s` (status key) | OperationList, OperationForm, MoveHistory, Dashboard |
| `Pill` | `c` (color), `children` | Stock, Dashboard, Profile, Locations, OpCard |
| `LateTag` | — | OperationList, OperationForm, Dashboard |
| `PName` | `p` (product object) | Stock, Dashboard, Adjustments, LineEditor, ProductDrawer |
| `Diamond` | `s` (size, default 14) | Navbar, AuthShell, PrintView |
| `Field` | `label`, `req`, `hint`, `error`, `children` | All forms |
| `ReadVal` | `mono`, `children` | OperationForm |
| `PwInput` | `value`, `onChange`, `placeholder`, `autoFocus` | Login, Signup, ForgotPassword, Profile |
| `RuleList` | `pw` (password string) | Signup, ForgotPassword, Profile |
| `pwOk` | `p` → boolean (exported function) | Signup, ForgotPassword, Profile |
| `Drawer` | `title`, `onClose`, `children`, `footer` | ProductDrawer, AdjustDrawer, WarehouseDrawer, LocationDrawer |
| `Modal` | `title`, `onClose`, `children`, `footer` | ProductModal |
| `ConfirmDialog` | `title`, `body`, `confirm`, `danger`, `onYes`, `onClose` | App (global) |
| `Dropdown` | `trigger`, `children`, `align` | Navbar, MoveHistory |
| `Empty` | `icon`, `title`, `sub`, `action` | Dashboard, OperationList, Stock, MoveHistory, Adjustments, PrintView |
| `SearchBox` | `value`, `onChange`, `placeholder`, `w` | Dashboard, OperationList, Stock, MoveHistory, Adjustments |
| `ViewToggle` | `v`, `set` | OperationList, MoveHistory |
| `ChipSelect` | `value`, `onChange`, `options`, `label` | Dashboard, OperationList, Stock, MoveHistory |
| `Toasts` | `list` | App (global) |

### Domain Components (`components/domain/index.jsx`)

| Component | Props | Used by |
|---|---|---|
| `StatusBar` | `kind`, `status` | OperationForm |
| `OpCard` | `icon`, `title`, `n`, `label`, `onMain`, `stats`, `info` | Dashboard |
| `Kpi` | `label`, `value`, `icon`, `color`, `onClick` | Dashboard |
| `LineEditor` | `f`, `setF`, `editable`, `outgoing`, `op` | OperationForm |
| `StockPopover` | `p`, `whId`, `onClose` | Stock |
| `ProductDrawer` | `pid`, `onClose`, `onEdit`, `canDelete` | Stock |
| `ProductModal` | `product`, `onClose` | Stock |
| `AdjustDrawer` | `onClose` | Adjustments |
| `WarehouseDrawer` | `w`, `onClose` | Warehouses |
| `LocationDrawer` | `l`, `onClose` | Locations |

### Layout Components (`components/layout/index.jsx`)

| Component | Props | Used by |
|---|---|---|
| `Navbar` | — | AppLayout |
| `PageHeader` | `onNew`, `newLabel`, `title`, `sub`, `right`, `newDisabled`, `newTitle` | Dashboard, OperationList, Adjustments, Warehouses, Locations, Profile |
| `AuthShell` | `children` | Login, Signup, ForgotPassword |
| `SettingsLayout` | `active`, `children` | Warehouses, Locations |
| `AppLayout` | — | App (route wrapper) |

---

## 11. Seed Data

### Users

| ID | Login ID | Name | Role |
|---|---|---|---|
| 1 | arjunk | Arjun Kumar | MANAGER |
| 2 | priyas | Priya Sharma | STAFF |

### Warehouses

| ID | Name | Short Code | Address |
|---|---|---|---|
| 1 | Main Warehouse | WH | Plot 14, MIDC, Pune |
| 2 | Secondary Warehouse | WH2 | Sector 5, Noida |

### Locations

| ID | Full Name | Type | Warehouse |
|---|---|---|---|
| 1 | WH/Stock1 | INTERNAL | WH |
| 2 | WH/Stock2 | INTERNAL | WH |
| 3 | WH/RackA | INTERNAL | WH |
| 4 | WH2/Stock1 | INTERNAL | WH2 |
| 90 | Vendor | VENDOR | — |
| 91 | Customer | CUSTOMER | — |
| 92 | Inventory Loss | LOSS | — |

### Categories

Furniture, Raw Material, Hardware, Consumables

### Products

| ID | SKU | Name | Category | UoM | Cost | Min | Max |
|---|---|---|---|---|---|---|---|
| 1 | DESK001 | Desk | Furniture | Units | ₹3,000 | 10 | 60 |
| 2 | TBL003 | Table | Furniture | Units | ₹3,000 | 10 | 60 |
| 3 | CHR002 | Chair | Furniture | Units | ₹850 | 10 | 40 |
| 4 | STL010 | Steel Rods | Raw Material | kg | ₹62 | 20 | 150 |
| 5 | BLT005 | Bolts M8 | Hardware | Box | ₹120 | 50 | 120 |
| 6 | PNT007 | Paint 1L | Consumables | L | ₹340 | 15 | 100 |
| 7 | PLY004 | Plywood Sheet | Raw Material | Units | ₹1,450 | 5 | 30 |

### Pre-built operations (in seed)

**Done:**
1. Receipt from Azure Interior: 50 Desk + 50 Table → WH/Stock1 (6 days ago)
2. Receipt from Steel Mart: 100 Steel Rods + 12 Bolts → WH/Stock1 (5 days ago)
3. Receipt from Kumar Traders: 10 Chair + 80 Paint → WH/Stock1 (4 days ago)
4. Internal transfer: 40 Steel Rods, WH/Stock1 → WH/RackA (3 days ago)
5. Delivery to Azure Interior: 6 Chair (3 days ago)
6. Delivery to Sharma & Co: 57 Steel Rods (2 days ago)
7. Delivery to Kumar Traders: 10 Paint (yesterday)
8. Adjustment: Steel Rods at RackA counted 37 (was 40, -3 Damaged) (yesterday)

**Pending:**
9. Receipt from Vendor Co.: 50 Bolts → WH/RackA — **READY, scheduled yesterday → LATE**
10. Receipt from Steel Mart: 60 Steel Rods → WH/Stock1 — **READY, tomorrow**
11. Receipt from Kumar Traders: 20 Chair → WH/Stock1 — **DRAFT, day after tomorrow**
12. Receipt from Azure Interior: 5 Desk → WH/Stock1 — **CANCELED**
13. Delivery to Azure Interior: 5 Desk — **READY, tomorrow**
14. Delivery to Sharma & Co: 10 Chair + 2 Desk — **WAITING (Chair short), scheduled yesterday → LATE**
15. Delivery to Kumar Traders: 3 Table — **DRAFT, 3 days out**
16. Internal transfer: 10 Paint, WH/Stock1 → WH/Stock2 — **READY, tomorrow**

### Demo starting state

- **Late ops:** Receipt #9 (yesterday, READY), Delivery #14 (yesterday, WAITING)
- **Waiting ops:** Delivery #14 (Chair + Desk short)
- **Low/out of stock:** Bolts M8 (12 on hand, min 50 → LOW), Steel Rods (~0 on hand after deliveries, min 20 → OUT/LOW), Chair (4 on hand, min 10 → LOW), Plywood Sheet (0 on hand → OUT)

---

## 12. Demo Script

1. **Login** → enter `arjunk` / `Admin@123` → see welcome toast + low stock alert
2. **Dashboard** → point out KPIs (late, low stock, out of stock), receipt/delivery cards with counts
3. **Low Stock Alerts** → show 5 items with progress bars → click "Create receipt" to auto-prefill a receipt
4. **Receipts** → show tabbed list → switch to Kanban view → point out late receipt (red tag)
5. **Open a READY receipt** → click "Validate" → confirm → see Done toast + auto-promotion of waiting ops
6. **Deliveries** → show Waiting delivery → click "Check Availability" → if promoted, show toast
7. **Create new delivery** → fill form, add products → see live "free to use" and short-stock warnings → click "To Do"
8. **Stock page** → show product table → click pencil icon → adjust stock via popover → see adjustment reference
9. **Click a product row** → ProductDrawer: stock by location, reorder rule, recent moves
10. **New Product** → create via modal with initial stock → see auto-receipt
11. **Adjustments** → show adjustment log → create new via drawer → see diff preview
12. **Move History** → filter by product → switch to Kanban → export CSV
13. **Settings** → Warehouses and Locations (Manager only) → create a new warehouse → auto-creates Stock location
14. **Profile** → edit name → change password → show "Reset demo data"
15. **Logout / Login as Staff** → show disabled warehouse/location editing
16. **Print** → open a Done operation → click Print → show light-themed print document

---

## 13. Backend Integration Guide

### Architecture change

Replace `engine.js` mutations and `StoreProvider.run()` with REST API calls. The `db` state becomes server-managed; the frontend fetches and caches.

### Files to change

| File | Change |
|---|---|
| `store/StoreProvider.jsx` | Replace `run()` with async API calls; remove `buildSeed()`, `structuredClone`, localStorage persistence |
| `lib/engine.js` | Keep selector functions (read-only), remove all mutations; or delete entirely if selectors move to API |
| `lib/seed.js` | Delete (seed moves to backend migration) |
| All pages/components calling `run()` | Swap `run(fn)` pattern for `await api.post(...)` + refetch or optimistic update |

### Endpoint mapping

| engine.js function | REST endpoint | Method | Request body | Response |
|---|---|---|---|---|
| `createOp(db, data, userId)` | `/api/operations` | POST | `{ type, contact, deliveryAddress, scheduledDate, sourceLocId, destLocId, warehouseId, lines: [{productId, quantity}] }` | `{ id, reference, status, ... }` |
| `updateOp(db, id, data)` | `/api/operations/:id` | PUT | Same as create body | `{ id, reference, ... }` |
| `todoOp(db, id)` | `/api/operations/:id/todo` | POST | `{}` | `{ status, shortLines? }` |
| `validateOp(db, id, userId)` | `/api/operations/:id/validate` | POST | `{}` | `{ status, doneDate, promoted: [refs] }` |
| `checkAvail(db, id)` | `/api/operations/:id/check` | POST | `{}` | `{ status }` |
| `cancelOp(db, id)` | `/api/operations/:id/cancel` | POST | `{}` | `{ status }` |
| `adjust(db, data, userId)` | `/api/adjustments` | POST | `{ productId, locationId, counted, reason }` | `{ op, diff }` |
| `saveProduct(db, data, userId)` | `/api/products` | POST/PUT | `{ name, sku, category, uom, unitCost, reorderMin, reorderMax, initial?, locationId? }` | `{ id, ref? }` |
| `saveWarehouse(db, data)` | `/api/warehouses` | POST/PUT | `{ name, shortCode, address }` | `{ id, shortCode }` |
| `saveLocation(db, data)` | `/api/locations` | POST/PUT | `{ name, shortCode, warehouseId }` | `{ id, fullName }` |
| Login | `/api/auth/login` | POST | `{ loginId, password }` | `{ token, user }` |
| Signup | `/api/auth/signup` | POST | `{ loginId, email, password }` | `{ token, user }` |
| Reset password | `/api/auth/reset-password` | POST | `{ email }` → `{ otp, newPassword }` | `{ success }` |

**Selectors to replace with GET endpoints:**

| Selector | Endpoint | Response |
|---|---|---|
| `db.operations` list | `GET /api/operations?type=&status=&wh=` | `[{id, reference, type, status, ...}]` |
| `getOp(db, id)` | `GET /api/operations/:id` | Full operation with lines |
| `db.products` list | `GET /api/products?category=&wh=` | Products with computed on_hand, free |
| Stock per location | `GET /api/stock?product=&location=` | `[{locationId, onHand, free}]` |
| `db.moves` list | `GET /api/moves?product=&type=&direction=` | `[{id, reference, product, from, to, qty, ...}]` |
| `db.warehouses` | `GET /api/warehouses` | `[{id, name, shortCode, address}]` |
| `db.locations` | `GET /api/locations?wh=` | `[{id, name, fullName, type, warehouseId}]` |
| Dashboard KPIs | `GET /api/dashboard?wh=` | `{ toReceive, late, waiting, ... }` |

---

## 14. Deviations from Spec

| Area | Spec says | Code does | Reason |
|---|---|---|---|
| Design tokens | Define in `tailwind.config.js` | Defined as CSS custom properties in `index.css` under `.ss` | Using Tailwind v4 which doesn't use `tailwind.config.js`; tokens in CSS work with the Vite plugin |
| Kanban view icon | `Columns3` icon | `LayoutGrid` icon | `LayoutGrid` chosen instead; functionally equivalent |
| KPI animation | Count up from 0 on first load (400ms) | No count-up animation | Not implemented |
| Settings nav icon | `Settings` icon | Dropdown with `ChevronDown` | Settings is a dropdown menu, not a separate nav icon |
| Modal backdrop | Blur `4px` | No blur, just `rgba(0,0,0,.7)` | Simplified implementation |
| Modal elevation | `0 24px 48px rgba(0,0,0,0.5)` shadow | No explicit shadow on modal | Uses surface-3 background for depth |
| Token naming | Uses semantic names (`surface`, `accent`, etc.) | Uses shorthand (`--s1`, `--ac`, etc.) | Shorter names chosen for compact CSS |
| CSS approach | "Never hard-code a hex value" in components | Some hex values appear in JSX inline styles (e.g., chart colors) | Practical choice for one-off values in Recharts config |
| New signups | Spec doesn't specify role | Always created as `MANAGER` | Simplification for demo |
| Delivery form | Spec has "Contact" as required | Code has `deliveryAddress` required, `contact` optional | Intentional — address is more important for deliveries |

---

## 15. Known Limitations & TODO

- **Mock data only** — all state is in localStorage; no backend API integration
- **Prefill state lost on refresh** — `location.state.prefill` (used for dashboard "Create receipt") is cleared on page reload
- **No pagination** — all operations/products loaded at once; will need pagination for real data
- **No real authentication** — passwords stored in plaintext in the client-side db; OTP is generated client-side
- **No responsive mobile layout** — the app uses desktop-first layout; drawer width is fixed at 480px
- **No real email sending** — forgot password OTP is displayed on screen for dev purposes
- **SignUp always creates MANAGER role** — no role assignment UI
- **No product deletion cascade** — deleting a product with stock history is blocked, but quants are not cleaned up
- **`hero.png` and `vite.svg` are unused** — sitting in `src/assets/`
- **No data export for stock or products** — CSV export exists only on Move History
- **`reference/stocksense_frontend.jsx`** — 133KB single-file reference JSX exists in `reference/` directory (excluded from build via Vite config)
- **No i18n** — hardcoded English strings and INR currency
- **Chart shows 0 for days with no moves** — intentional but could look empty on fresh data

---

## 16. Changelog

| Date | Commit | What changed |
|---|---|---|
| 2026-09-26 09:40 | `a2b1721` Initial commit | Repository created |
| 2026-09-26 09:53 | `1f0c20d` Initial frontend spec md | `frontend_spec.md` added |
| 2026-09-26 11:10 | `160716f` frontend phase 1 done | Full frontend implementation: all pages, components, engine, seed data, styles |
| 2026-09-26 11:32 | `c520f0b` added .gitignore | `.gitignore` added |
| 2026-09-26 11:54 | `c2712cc` feat: initialize backend with Prisma and define domain schema | Backend Prisma schema (separate from frontend) |
