# StockSense: Frontend & Design Specification

> **Design direction in one line:** *A calm, dark control room for stock.* The interface should feel like a precise instrument, not a colorful dashboard toy. Coral is used sparingly, only where the user must act. Every number is easy to scan, and every status can be understood at a glance, even without color.

This document covers **what the user sees and can do**. Backend details live in `phases.md`.

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Design System (Tokens)](#2-design-system-tokens)
3. [Component Library](#3-component-library)
4. [App Shell & Navigation](#4-app-shell--navigation)
5. [Screen-by-Screen Specification](#5-screen-by-screen-specification)
6. [Cross-Cutting Behaviour](#6-cross-cutting-behaviour)
7. [Microcopy Guide](#7-microcopy-guide)
8. [Accessibility & Responsiveness](#8-accessibility--responsiveness)
9. [Frontend Folder Structure & Build Order](#9-frontend-folder-structure--build-order)
10. [Designer's QA Checklist](#10-designers-qa-checklist)

---

## 1. Design Principles

| # | Principle | What it means in practice |
|---|---|---|
| 1 | **Faithful to the mockup** | Same screens, same button order, same labels. We *refine* the mockup; we never *reinvent* it. Judges compare side by side. |
| 2 | **Coral means "act here"** | The accent appears only on primary buttons, the active nav item, focus rings and the current status step. If everything is coral, nothing is. |
| 3 | **Numbers are the heroes** | Quantities, references and SKUs use a monospace font with tabular figures and are right-aligned in tables. A stock app is read in columns. |
| 4 | **Status is never color-only** | Every status has a color, a label and a position on the status bar. This keeps it colorblind-safe and readable in print. |
| 5 | **One pattern, reused everywhere** | Receipts, Deliveries and Move History share one list layout. Receipt and Delivery share one form layout. Users learn it once. |
| 6 | **Always show what happens next** | Buttons state their outcome ("To Do", "Validate"). Stock changes are previewed before saving ("50 → 47, −3"). |
| 7 | **No dead ends** | Every empty state has a next action. Every error says how to fix it. |

---

## 2. Design System (Tokens)

Define these once in `tailwind.config.js`. **Never hard-code a hex value in a component.**

### 2.1 Color: Surfaces & Text

| Token | Hex | Use |
|---|---|---|
| `bg` | `#0F0F10` | App background |
| `surface` | `#17171A` | Cards, tables, navbar |
| `surface-2` | `#1F1F23` | Inputs, hovered rows, kanban columns |
| `surface-3` | `#27272C` | Dropdowns, modals, popovers |
| `border` | `#2A2A30` | Default 1px borders, dividers |
| `border-strong` | `#3A3A42` | Input borders, focused table rows |
| `text` | `#EDEDEF` | Primary text |
| `text-2` | `#A1A1AA` | Labels, secondary text, column headers |
| `text-3` | `#71717A` | Placeholders, hints, disabled |

### 2.2 Color: Brand Accent (from the mockup)

| Token | Hex | Use |
|---|---|---|
| `accent` | `#F47272` | Primary buttons, active nav underline, current status step, focus ring |
| `accent-hover` | `#F68A8A` | Hover |
| `accent-press` | `#E05A5A` | Active/pressed |
| `accent-soft` | `rgba(244,114,114,0.12)` | Selected row tint, active tab background |
| `on-accent` | `#1A0B0B` | Text on coral buttons (dark text passes contrast; white does not) |

### 2.3 Color: Semantic

| Meaning | Token | Hex | Where |
|---|---|---|---|
| Draft | `st-draft` | `#8B8B94` | Status badge |
| Waiting | `st-waiting` | `#F5A524` | Status badge, "waiting" count |
| Ready | `st-ready` | `#4C8DFF` | Status badge |
| Done | `st-done` | `#2FBF71` | Status badge |
| Canceled | `st-canceled` | `#5C5C66` + ~~strikethrough~~ reference | Status badge |
| Stock IN | `move-in` | `#2FBF71` | Move History rows, `+` quantities |
| Stock OUT | `move-out` | `#FF5C5C` | Move History rows, `−` quantities, out-of-stock lines |
| Late | `late` | `#FF5C5C` | "Late" tag, late counts |
| Low stock | `low` | `#F5A524` | Low-stock badge |

> **Designer's note:** Canceled is deliberately **gray, not red**. Red is reserved for *problems needing attention* (out of stock, late, stock out). A canceled document is finished business, not an alarm. Also, red sits too close to our coral brand color; keeping it for real problems makes those stand out.

**Badges** use a tinted style: background at 12% opacity of the status color, text at 100%, with a 6px dot before the label.
Example: `● Ready` shows blue text and a blue dot on a faint blue pill.

### 2.4 Typography

| Role | Font | Size / Line | Weight | Notes |
|---|---|---|---|---|
| Display (KPI numbers) | Inter | 32 / 40 | 600 | `tabular-nums` |
| Page title | Inter | 20 / 28 | 600 | "Receipts", "Dashboard" |
| Section title | Inter | 16 / 24 | 600 | "Products" section in forms |
| Body | Inter | 14 / 20 | 400 | Default |
| Table cell | Inter | 13 / 20 | 400 | Dense but readable |
| Label / column header | Inter | 12 / 16 | 500 | `text-2`, uppercase, tracking +0.04em |
| **Mono (data)** | JetBrains Mono | 13 / 20 | 500 | References (`WH/IN/0001`), SKUs (`DESK001`), quantities, currency |

- Load both fonts from Google Fonts with `display=swap`.
- **Numeric columns are right-aligned** with `font-variant-numeric: tabular-nums` so digits line up.
- Currency is shown as `₹3,000.00` using `Intl.NumberFormat('en-IN')`, which gives Indian grouping (₹1,00,000).

### 2.5 Spacing, Radius, Elevation

- **Spacing:** 4px grid. Common values are 4, 8, 12, 16, 24, 32.
  - Page padding: 24px
  - Card padding: 20px
  - Table cell padding: 12px × 16px
- **Radius:** inputs, buttons and badges 8px; cards and modals 12px; pills 999px.
- **Elevation:** dark UIs show depth with **lighter surfaces, not shadows**.
  - Cards sit on `surface` with a 1px `border`.
  - Modals use `surface-3` with a soft shadow `0 24px 48px rgba(0,0,0,0.5)` and a backdrop `rgba(0,0,0,0.6)` with an 4px blur.
- **Row height:** 44px (comfortable for touch, dense enough for lists of about 20 rows).

### 2.6 Iconography

- **lucide-react only**, at 16px (inline) or 18px (buttons/nav), stroke 1.75.
- Fixed icon vocabulary. Use the same icon for the same meaning everywhere.

| Meaning | Icon |
|---|---|
| Receipt / IN | `ArrowDownToLine` |
| Delivery / OUT | `ArrowUpFromLine` |
| Internal transfer | `ArrowLeftRight` |
| Adjustment | `SlidersHorizontal` |
| Stock | `Boxes` |
| Move History | `History` |
| Settings | `Settings` |
| Search | `Search` |
| List view | `List` |
| Kanban view | `Columns3` |
| Print | `Printer` |
| Late | `Clock` |
| Low stock | `AlertTriangle` |

### 2.7 Motion

Motion should be subtle and functional, and never slow down a user who is moving fast.

| Where | Animation |
|---|---|
| Hover / focus | 120ms ease-out color transitions |
| Modals, dropdowns | 160ms fade + 4px rise |
| Status bar step change | 200ms coral fill sliding to the new step (a small, satisfying moment in the demo) |
| KPI numbers | Count up from 0 on first load (400ms); no animation on refetch |
| Toasts | Slide in from the top-right |
| Accessibility | Respect `prefers-reduced-motion` by disabling all of the above |

---

## 3. Component Library

Build these **before** screens (Phase 2 in `phases.md`). Every screen is composed from them.

### 3.1 Buttons

| Variant | Look | Used for |
|---|---|---|
| **Primary** | Coral fill, dark text | The one main action per view: *To Do*, *Validate*, *Sign In*, *Save* |
| **Secondary** | `surface-2` fill, 1px `border-strong` | *Print*, *New*, *Check Availability* |
| **Ghost** | No fill; text-2 turning to text on hover | Toolbar icons, "Forgot password?" |
| **Danger** | Transparent with red text and border; filled red on hover | *Cancel* (the operation), *Delete* |

- **Sizes:** `sm` 32px, `md` 36px (default), `lg` 44px (auth pages).
- **States:**
  - hover and pressed
  - focus: a 2px coral ring with a 2px offset
  - disabled: 40% opacity, `not-allowed` cursor, **with a tooltip explaining why**
  - loading: spinner replaces the icon, label stays, button disabled

**Rule:** at most **one primary button per screen region.**

### 3.2 Form Inputs

- **Text input:** height 36px, `surface-2` fill, `border-strong` border, which turns coral on focus.
- **Label** sits above the input (12px, text-2). **Helper or error text** sits below (12px). Errors are red with an `AlertCircle` icon.
- **Required fields** are marked with a coral `*`.
- **Select / Combobox:** searchable (type to filter). Used for products, locations and warehouses.
- **Product combobox options** show `[DESK001] Desk` with the SKU in mono, plus a right-aligned `Free: 45` hint.
- **Date picker:** a native `<input type="date">` styled to match. It's reliable and fast to build.
- **Password field:** eye toggle, plus a **live rule checklist** below it (see Sign Up).
- **Read-only field** (Responsible): no border, `text-2`, with a small lock icon.

### 3.3 StatusBadge

`● Draft` · `● Waiting` · `● Ready` · `● Done` · `● Canceled`

These are pill badges following §2.3, and they are the same everywhere: tables, kanban cards and forms.

### 3.4 StatusBar (the breadcrumb from the mockup)

```
 Receipt:   ( Draft ) ──── ( Ready ) ──── ( Done )
 Delivery:  ( Draft ) ── ( Waiting ) ── ( Ready ) ── ( Done )
```

- **Completed steps:** text-2 with a check mark.
- **Current step:** coral filled pill.
- **Future steps:** text-3 outline.
- **Canceled** replaces the whole bar with a single gray `Canceled` pill.
- **Receipts have no Waiting step.** Hide it rather than showing it grayed out, so the bar only shows real steps.

### 3.5 PageHeader (shared by every list screen)

```
┌──────────────────────────────────────────────────────────────────────┐
│ [+ New]  Receipts                     [🔍 Search ref or contact ] [☰][▦] │
└──────────────────────────────────────────────────────────────────────┘
```

- **Left:** a `New` button (secondary, placed exactly as in the mockup) and the page title.
- **Right:** the search input (it expands on focus) and a **segmented list/kanban toggle** whose active side is tinted with `accent-soft`.
- **Below:** an optional `FilterBar` row.

### 3.6 FilterBar

- Horizontal chips: **Status ▾ · Warehouse ▾ · Category ▾ · Date ▾**
- Each chip opens a small multi-select popover. Active chips show their value ("Status: Ready, Waiting") in `accent-soft` with an `×` to clear.
- A "Clear all" ghost button appears when any filter is active.
- **Filters and search live in the URL** (for example `?status=READY&q=azure`), so refresh, back and dashboard deep-links all work.

### 3.7 DataTable

- **Header row:** sticky, uppercase 12px `text-2`, 1px bottom border.
- **Rows:** 44px tall, hover `surface-2`, and the whole row is clickable (cursor pointer, keyboard Enter).
- **Columns:**
  - Text columns are left-aligned.
  - **Number columns are right-aligned in mono.**
  - Date columns use the `DD MMM YYYY` format (for example `26 Sep 2026`).
- **Late rows:** a small red `Clock Late` tag after the date.
- **Sorting:** click a header to sort, with a chevron for direction. Default sort is Schedule Date descending.
- **Pagination:** "Showing 1–20 of 57" with prev/next. Client-side is fine for a hackathon.
- **States:** a skeleton of 6 shimmering rows while loading, then `EmptyState` if there's no data.

### 3.8 KanbanBoard

```
 DRAFT (2)        WAITING (1)       READY (4)         DONE (12)
┌────────────┐   ┌────────────┐    ┌────────────┐    ┌────────────┐
│WH/OUT/0003 │   │WH/OUT/0002 │    │WH/IN/0004  │    │WH/IN/0001  │
│Azure Int.  │   │Azure Int.  │    │Vendor Co.  │    │...         │
│📅 28 Sep   │   │📅 25 Sep ⏰│    │📅 27 Sep   │    │            │
│3 products  │   │1 product   │    │2 products  │    │            │
└────────────┘   └────────────┘    └────────────┘    └────────────┘
```

- **Columns:** a `surface-2` background, and a header showing the status dot, name and count.
- **Cards:** `surface`, 12px padding.
  - Reference in mono (bold)
  - Contact
  - Schedule date, plus the Late clock if applicable
  - Product count
  - A left border in the status color
- **No drag-and-drop.** Status changes only through form buttons, which guarantees stock logic always runs. Clicking a card opens the form.
- Canceled documents are collapsed into a "Canceled (n)" link at the end to reduce noise.

### 3.9 KPI Card (Dashboard)

```
┌───────────────────────────────────────────────┐
│  ↓ Receipt                                     │
│                                               │
│  ┌──────────────────┐     ⏰ 1 Late            │
│  │  4 to receive  → │        6 Operations     │
│  └──────────────────┘                          │
└───────────────────────────────────────────────┘
```

- The main button is **coral-outline, large**, following the mockup. Clicking it opens the list filtered to READY.
- Secondary counts are right-aligned text links; each opens its own filtered list.
- A count of 0 shows in `text-3`. Late counts above 0 show red.

### 3.10 ProductLineEditor (inside operation forms)

```
 PRODUCTS
 ┌─────────────────────────────────────┬───────────┬──────────┬───┐
 │ Product                             │ Free      │ Quantity │   │
 ├─────────────────────────────────────┼───────────┼──────────┼───┤
 │ [DESK001] Desk                      │ 45        │ 6        │ 🗑 │
 │ [CHR002] Chair            ⚠ Short  │ 4         │ 10       │ 🗑 │  ← red row
 ├─────────────────────────────────────┴───────────┴──────────┴───┤
 │ + New Product                                                  │
 └────────────────────────────────────────────────────────────────┘
```

- **"+ New Product"** (the mockup's label) adds a row and focuses its product combobox.
- **Free column:** shown only on Delivery and Internal transfers. Receipts don't need it.
- **Red line rule (from the mockup):** if quantity > free stock, the row gets:
  - a red 3px left border
  - a faint red tint
  - a red quantity
  - a `⚠ Short by 6` tag
- The first time a line goes short, a toast appears: *"Chair: only 4 available. This delivery will wait for stock."*
- Rows are **editable only in Draft**. In any other status they're read-only text.
- **Keyboard:** Enter in the quantity field adds a new row.
- **Validation:**
  - quantity must be > 0
  - the same product can't appear twice (instead, focus the existing row and show "Already added")
  - at least one row is required before *To Do*

### 3.11 Feedback Components

- **Toast** (react-hot-toast, restyled):
  - success: a green left bar
  - error: a red left bar
  - top-right, auto-dismiss after 4s; errors stay for 6s
- **ConfirmDialog:** for *Validate* ("This will move stock. Continue?") and *Cancel* ("Cancel WH/OUT/0002? This can't be undone.").
- **EmptyState:** a 48px icon in `text-3`, a one-line title, a helper line, and one primary action.
- **Skeleton:** shimmering `surface-2` blocks shaped like the real content.
- **Tooltip:** on disabled buttons and truncated text.

### 3.12 Avatar Menu

- A circular avatar at top-right showing initials (for example "AK") on an `accent-soft` background with coral text.
- **Dropdown:**
  - a header with the name, Login ID (mono) and role badge
  - My Profile
  - a divider
  - Logout (in red text)

---

## 4. App Shell & Navigation

### 4.1 Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ◆ StockSense   Dashboard  Operations▾  Stock  Move History  Settings▾  (AK)│  ← 56px navbar
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   PageHeader                                                             │
│   FilterBar                                                              │
│   Content (max-width 1280px, centered, 24px padding)                     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Navbar:** `surface` background with a bottom border.
  - The **active item** gets coral text and a 2px coral underline on the navbar's bottom edge (echoing the coral rule in the mockup).
- **Operations ▾** contains: Receipts · Deliveries · Adjustments. Each has its icon from §2.6.
- **Settings ▾** contains: Warehouse · Location.
- **Global shortcut:** `/` focuses the page search, and `Ctrl/⌘ + K` opens a quick "Go to product or reference" palette (optional bonus).

### 4.2 Route Map

| Route | Screen | Access |
|---|---|---|
| `/login` | Login | Public |
| `/signup` | Sign Up | Public |
| `/forgot-password` | Forgot Password (3 steps) | Public |
| `/` | Dashboard | Authenticated |
| `/receipts` · `/receipts/new` · `/receipts/:id` | Receipt list / form | Authenticated |
| `/deliveries` · `/deliveries/new` · `/deliveries/:id` | Delivery list / form | Authenticated |
| `/operations/:id/print` | Print view | Authenticated |
| `/adjustments` | Adjustments | Authenticated |
| `/stock` | Stock | Authenticated |
| `/move-history` | Move History | Authenticated |
| `/settings/warehouses` · `/settings/locations` | Settings | Authenticated (editing is Manager only) |
| `/profile` | My Profile | Authenticated |
| `*` | 404 page | — |

- An unauthenticated visit redirects to `/login?next=/original-path`. After login, the user returns to that path.

---

## 5. Screen-by-Screen Specification

Each screen is described by **Purpose → Layout → Elements → Functionality → States → Edge cases**.

---

### 5.1 Login

**Purpose:** Get staff into the app in under five seconds.

**Layout:** a centered card (400px wide) on the `bg` background, with a very subtle radial coral glow behind it (a single CSS gradient at about 6% opacity). That glow is the one decorative moment in the app.

```
            ◆  StockSense
        Inventory, in real time

   ┌────────────────────────────────┐
   │ Login ID                        │
   │ [ ______________________ ]      │
   │ Password                        │
   │ [ ______________________ 👁 ]   │
   │                                 │
   │ [        Sign In         ]      │  ← primary, lg, full width
   │                                 │
   │ Forgot password?  |  Sign up    │
   └────────────────────────────────┘
```

**Functionality**
- Submit on Enter, and the button shows a spinner while waiting.
- Wrong credentials show one generic inline error above the button: *"Invalid Login ID or Password."* Never say which field was wrong.
- On success, go to `next` or `/`, and show a welcome toast: *"Welcome back, Arjun."*
- If any items are low on stock, a second toast follows: *"3 items are low on stock"*, with a **View** link.

**States:** idle, submitting, error (fields keep their values; the password field is cleared and focused).

---

### 5.2 Sign Up

**Layout:** the same card as Login, with fields Login ID, Email, Password and Re-enter Password.

**Live validation.** The rules are shown **before** the user fails them, not after.

```
Password
[ ••••••••••  👁 ]
  ✓ At least 8 characters
  ✓ One lowercase letter
  ✗ One uppercase letter
  ✗ One special character
```

- Unmet rules show in `text-3` with ✗; met rules turn green with ✓. Each rule animates as it is satisfied.
- **Login ID:** a 6–12 character counter shows at the right of the input (`7/12`). Uniqueness is checked by the server on submit.
- **Email:** format is checked on blur. A duplicate email returns the inline error *"This email is already registered. Sign in instead?"* with a link.
- **Re-enter Password:** shows "Passwords match" in green only once it matches.
- **Sign Up button** is disabled until every rule passes. A tooltip on the disabled button says what's missing.

**On success:** auto-login, go to the Dashboard, and toast *"Account created."*

---

### 5.3 Forgot Password (3-step flow on one screen)

```
Step indicator:   ● Email  ──  ○ Verify  ──  ○ New password
```

1. **Email / Login ID:** submit, then a toast says *"If an account exists, we've sent a code."* This wording doesn't reveal whether the account exists.
2. **Verify:**
   - Six separate digit boxes. Auto-advance to the next box on each digit, and paste fills all six.
   - A countdown reads "Code expires in 09:42". *Resend code* becomes active after 30 seconds.
   - An incorrect code shakes the boxes and shows *"Incorrect code. 2 attempts left."*
3. **New password:** the same live rule checklist as Sign Up, then a toast (*"Password updated. Please sign in."*) and redirect to `/login`.

**Dev convenience:** in development mode only, show a small gray "Dev OTP: 482913" hint below the digit boxes, so the demo never depends on email delivery. Remove it or hide it behind an environment flag for production.

---

### 5.4 Dashboard

**Purpose:** Answer the question *"What needs my attention today?"* in under 3 seconds.

```
Dashboard                                      [Warehouse: All ▾]
────────────────────────────────────────────────────────────────
┌──── ↓ Receipt ──────────────────┐ ┌──── ↑ Delivery ─────────────────┐
│ [ 4 to receive → ]   ⏰ 1 Late   │ │ [ 4 to deliver → ]  ⏰ 1 Late    │
│                      6 Operations│ │                     ⏳ 2 Waiting │
│                                  │ │                     6 Operations │
└──────────────────────────────────┘ └──────────────────────────────────┘

┌ In stock ┐ ┌ Low stock ┐ ┌ Out of stock ┐ ┌ Transfers ┐ ┌ Total units ┐   ← KPI strip
│   42     │ │   3  ⚠    │ │     1        │ │    2      │ │   1,240     │
└──────────┘ └───────────┘ └──────────────┘ └───────────┘ └─────────────┘

Filters:  [Type ▾] [Status ▾] [Warehouse ▾] [Category ▾]

┌──── Recent Operations ─────────────────┐ ┌──── ⚠ Low Stock Alerts ─────┐
│ WH/IN/0004  Vendor Co.   ● Ready       │ │ [CHR002] Chair   4 / min 10 │
│ WH/OUT/0003 Azure Int.   ● Waiting     │ │ [STL010] Steel   0 / min 20 │
│ ... (8 rows)                View all → │ │ [+ Create receipt]          │
└────────────────────────────────────────┘ └─────────────────────────────┘

┌──── Stock In vs Out: last 7 days (optional chart) ───────────────────┐
│  grouped bars: green = in, red = out                                 │
└──────────────────────────────────────────────────────────────────────┘
```

**The two mockup cards (required, pixel-faithful)**

| Element | Definition | Click → |
|---|---|---|
| **N to receive** | Receipts in READY | `/receipts?status=READY` |
| Late (receipt) | Pending receipts with schedule date < today | `/receipts?late=1` |
| Operations (receipt) | Pending receipts with schedule date > today | `/receipts?upcoming=1` |
| **N to deliver** | Deliveries in READY | `/deliveries?status=READY` |
| Late (delivery) | Pending deliveries with schedule date < today | `/deliveries?late=1` |
| Waiting | Deliveries in WAITING | `/deliveries?status=WAITING` |
| Operations (delivery) | Pending deliveries with schedule date > today | `/deliveries?upcoming=1` |

A small ⓘ tooltip next to each card explains these definitions. This helps when judges ask what a number means.

**KPI strip (from the problem statement)**

| Tile | Meaning |
|---|---|
| Products in stock | Products with on-hand > 0 |
| Low stock | Products with free-to-use ≤ their reorder minimum. Amber, with ⚠ |
| Out of stock | Products with on-hand = 0. Red when > 0 |
| Internal transfers scheduled | Pending internal transfers |
| Total units on hand | Sum across all products |

Each tile links to the relevant filtered page (Stock with a low-stock filter, and so on).

**Dynamic filters** (document type, status, warehouse, category) recalculate every number on the page. Their values are kept in the URL.

**Low Stock Alerts panel**
- Shows up to 5 products as "free / min".
- **+ Create receipt** opens a pre-filled draft receipt for those products, with the reorder quantity (reorderMax − onHand). It's a small feature that looks impressive in the demo.

**States**
- Skeleton cards while loading.
- If there are no operations yet, the cards show 0 in `text-3`, and the Recent panel shows *"No operations yet"* with a **Create your first receipt** button.

---

### 5.5 Receipts: List View

**Layout:** PageHeader (New · Receipts · search · list/kanban toggle), then FilterBar, then DataTable or KanbanBoard.

| Column | Format | Notes |
|---|---|---|
| Reference | Mono, bold, e.g. `WH/IN/0001` | Strikethrough when Canceled |
| From | `Vendor` | |
| To | Mono, e.g. `WH/Stock1` | |
| Contact | Text | Truncated with a tooltip |
| Schedule Date | `26 Sep 2026` | Red `Late` tag if overdue and pending |
| Status | StatusBadge | |

**Functionality**
- **Search** matches reference *or* contact (as specified in the mockup), with a 300ms debounce and the matching text highlighted.
- **List/Kanban toggle:** list is the default. The choice is remembered for the session and reflected in the URL (`?view=kanban`).
- **Row click** opens `/receipts/:id`. The **New** button opens `/receipts/new`.
- **Quick filter tabs** above the table show counts: All · Draft · Ready · Done · Late.

**Empty state:** *"No receipts yet. Receipts record goods arriving from vendors."* with a **New Receipt** button.

---

### 5.6 Receipt: Form View

```
[New]  Receipt
────────────────────────────────────────────────────────────────────────
[ To Do ]  [ Print ]  [ Cancel ]                ( Draft )──( Ready )──( Done )
────────────────────────────────────────────────────────────────────────
WH/IN/0001                                   ← 24px mono title

Receive From *        [ Azure Interior        ]     Schedule Date *  [ 26/09/2026 ]
Responsible           🔒 Arjun Kumar (auto)         Destination      [ WH/Stock1 ▾ ]

PRODUCTS
[DESK001] Desk ........................................ 6
+ New Product
────────────────────────────────────────────────────────────────────────
                                              Total: 1 product · 6 units
```

**Button logic (from the mockup)**

| Status | Primary button | Print | Cancel | Fields editable? |
|---|---|---|---|---|
| New (unsaved) | **Save** (creates as Draft) | disabled | discard | ✅ |
| Draft | **To Do** → Ready | disabled (tooltip: "Available once Done") | ✅ | ✅ |
| Ready | **Validate** → Done (with confirm) | disabled | ✅ | ❌ header, ❌ lines |
| Done | none | ✅ **enabled** | hidden | ❌ read-only, with a green "Done · 26 Sep, 11:42" stamp |
| Canceled | none | disabled | hidden | ❌ with a gray "Canceled" stamp |

**Functionality**
- The reference appears after the first save. Before that, show a gray "New" placeholder.
- **Responsible** is auto-filled with the logged-in user and read-only (mockup note).
- **Validate:**
  1. A confirm dialog appears.
  2. The StatusBar animates to Done.
  3. A toast shows *"WH/IN/0001 validated · Desk +6"*.
  4. Stock, dashboard and history data are refetched in the background.
- **Unsaved changes guard:** leaving the page with edits prompts *"Discard changes?"*.
- **Keyboard:** `Ctrl+S` saves; `Ctrl+Enter` triggers the primary action.

---

### 5.7 Deliveries: List View

Identical to the Receipts list, with these differences:
- **Columns:** Reference (`WH/OUT/0001`) · From (`WH/Stock1`) · To (`Customer`) · Contact · Schedule Date · Status.
- **Quick tabs:** All · Draft · Waiting · Ready · Done · Late.
- A **Waiting** row shows a small `⏳` next to the badge, with the tooltip "Waiting for stock".

---

### 5.8 Delivery: Form View

```
[New]  Delivery
────────────────────────────────────────────────────────────────────────────
[ To Do ]  [ Print ]  [ Cancel ]       ( Draft )─( Waiting )─( Ready )─( Done )
────────────────────────────────────────────────────────────────────────────
WH/OUT/0001

Delivery Address *   [ 12 MG Road, Pune          ]   Schedule Date *  [ 27/09/2026 ]
Responsible          🔒 Arjun Kumar (auto)           Operation Type   [ Delivery ▾ ]
Contact              [ Azure Interior            ]   Source Location  [ WH/Stock1 ▾ ]

PRODUCTS                                         Free      Quantity
[DESK001] Desk ................................  45         6
[CHR002]  Chair  ⚠ Short by 6 ..................  4        10      ← RED LINE
+ New Product
```

**What differs from the Receipt form**

| Feature | Behaviour |
|---|---|
| **Operation Type** dropdown | `Delivery` (default) or `Internal Transfer`. Internal shows a **Destination Location** picker instead of Delivery Address and changes the reference prefix to `WH/INT/`. The form transitions smoothly between these without a page change. |
| **Free column** | Live "free to use" at the chosen source location. It updates when the source location changes. |
| **Red line rule** | Implements the mockup note ("alert the notification & mark the line red if product is not in stock"). See §3.10. |
| **Status flow** | Clicking **To Do** moves to **Ready** if every line is available, or **Waiting** if any is short. The toast explains which. |
| **Waiting state** | The primary button becomes **Check Availability** (secondary style). An info banner reads: *"Waiting for stock: Chair (short 6). This will become Ready automatically when stock arrives."* |
| **Pick → Pack → Validate** (from the problem statement) | In Ready, a small 3-step checklist appears above the products: ☐ Picked ☐ Packed. **Validate** is enabled once both are ticked. The ticks are UI-only, so it adds no backend work. |

---

### 5.9 Print View (Receipt / Delivery)

**Purpose:** A physical document for the warehouse floor or the driver. Required once Done (from the mockup).

- The route opens in a new tab and triggers `window.print()` on load.
- **A white theme only for print** (`@media print`): black text, no navbar, no buttons.
- **Layout on A4:**
  - **Header:** company name and logo, document title ("GOODS RECEIPT NOTE" / "DELIVERY NOTE"), and the reference in large mono.
  - **Meta block:** Contact · Address · Schedule date · Done date · Responsible.
  - **Lines table:** # · SKU · Product · UoM · Quantity.
  - **Footer:** totals, signature lines ("Received by" / "Delivered by"), and "Generated by StockSense · 26 Sep 2026 11:42".
- If the document isn't Done, show a clear message instead of printing: *"Printing is available after validation."*

---

### 5.10 Adjustments

**Purpose:** Correct the system when the physical count disagrees with it.

```
Adjustments                                                [+ New Adjustment]
───────────────────────────────────────────────────────────────────────────
┌─── New Adjustment (drawer from the right) ───────┐
│ Product *     [ [STL010] Steel ▾ ]               │
│ Location *    [ WH/Stock1 ▾ ]                    │
│                                                  │
│ Recorded      100 kg                             │
│ Counted *     [ 97 ]                             │
│ Difference    −3 kg   (red)                      │
│ Reason        [ Damaged ▾ ]  (Damaged / Lost /   │
│                Found / Count correction)         │
│                                                  │
│ Preview:  Steel @ WH/Stock1   100 → 97           │
│                                                  │
│            [ Cancel ]   [ Apply Adjustment ]     │
└──────────────────────────────────────────────────┘

History table: Reference (WH/ADJ/0001) · Date · Product · Location · Δ Qty (±, colored) · Reason · By
```

- The Difference is live: green with `+` for positive, red with `−` for negative, gray "No change" for zero. **Apply** is disabled when there's no change.
- **Reason** is a front-end-only dropdown stored in the operation's note. It makes the audit trail readable.
- **Success toast:** *"Steel adjusted −3 kg · WH/ADJ/0001"*.

---

### 5.11 Stock

**Purpose:** The mockup's Stock page. Shows *what we have and what we can promise*, and lets the user fix counts inline.

```
[+ New Product]  Stock                  [🔍 Search SKU or name]  [Category ▾] [Warehouse ▾] [☐ Low stock only]
─────────────────────────────────────────────────────────────────────────────────────────────
PRODUCT                 CATEGORY     UOM     PER UNIT COST     ON HAND     FREE TO USE     STATUS
[DESK001] Desk          Furniture    Units       ₹3,000.00          50              45     ● In stock
[TBL003]  Table         Furniture    Units       ₹3,000.00          50              50     ● In stock
[CHR002]  Chair         Furniture    Units         ₹850.00           4               4     ▲ Low
[STL010]  Steel         Raw          kg             ₹62.00           0               0     ● Out
```

**Columns**
- **Product, Per unit cost, On hand and Free to use** are the mockup's columns, kept in this order.
- Category, UoM and Status are added for the problem statement's filtering needs.
- When Free to use < On hand, a small tooltip explains the gap: *"5 reserved for WH/OUT/0003"*.

**Functionality**
- **Update stock inline** (mockup: "User must be able to update the stock from here"):
  1. Hovering a row shows a ✏️ pencil on the On hand cell.
  2. Clicking it opens a small popover: Location ▾ → Counted qty → a preview line "50 → 48 (−2)" → **Update**.
  3. Behind the scenes this creates an adjustment. The toast says so: *"Logged as WH/ADJ/0004"*. That line tells judges the ledger is respected.
- **Row click** opens a **Product drawer** from the right, containing:
  - a header with SKU, name, category and unit cost
  - **Stock by location** (a small table: location → on hand → free)
  - **Reordering rule** (min / max) with an inline edit
  - **Recent moves** for this product (last 5, colored ±) and a "View all" link to Move History filtered to it
  - Edit / Delete buttons (Delete is Manager only, disabled with a tooltip otherwise)
- **New Product modal:** Name*, SKU* (auto-uppercased, uniqueness shown on blur), Category (select, or type to create), UoM (Units / kg / m / L / Box), Per unit cost (₹), Initial stock + location (optional), Reorder min / max.
- **Low stock only** toggle, driven by the URL and linked from the Dashboard KPI.
- The summary line under the table reads: *"4 products · 104 units on hand · ₹1,82,448 stock value"*. It costs little to build and makes a strong impression.

---

### 5.12 Move History

**Purpose:** The ledger view. Every movement, one row per product (from the mockup).

```
[New]  Move History                        [🔍 Search ref or contact]  [☰][▦]
Filters: [Type ▾] [Status ▾] [Direction: All / In / Out ▾] [Date range ▾]
────────────────────────────────────────────────────────────────────────────────
REFERENCE      DATE          CONTACT          FROM        TO          QUANTITY   STATUS
WH/IN/0001     12 Jan 2026   Azure Interior   Vendor      WH/Stock1   + 6 Desk   ● Ready    ← green row
WH/OUT/0002    12 Jan 2026   Azure Interior   WH/Stock1   Customer    − 4 Chair  ● Ready    ← red row
WH/OUT/0002    12 Jan 2026   Azure Interior   WH/Stock1   Customer    − 1 Table  ● Ready    ← same ref, 2nd product
WH/INT/0001    13 Jan 2026   —                WH/Stock1   WH/RackA    ⇄ 10 Steel ● Done     ← neutral
```

**Rules from the mockup**
- **A multi-product reference appears as multiple rows.** Consecutive rows with the same reference are visually grouped: the reference text is shown on the first row only and dimmed on the rest.
- **In = green, Out = red.** Apply color to the quantity cell and a 3px left border, **not the whole row background**, which would make the page hard to read.
- Internal moves are neutral `text-2` with the `⇄` icon.
- Search matches reference or contact.
- **Kanban toggle** groups the cards by status.

**Extra**
- The **New** button (as in the mockup) opens a small menu: New Receipt / New Delivery / New Adjustment.
- An **Export CSV** ghost button (bonus).
- **Row click** opens the source operation.

---

### 5.13 Settings: Warehouse

- **List:** Name · Short Code (mono) · Address · Locations count. A **New** button opens a side drawer form.
- **Form fields** (mockup): Name*, Short Code* (2–5 characters, auto-uppercased), Address (textarea).
- **Helper text** under Short Code: *"Used in references, e.g. WH → WH/IN/0001. Can't be changed after the first operation."* This prevents confusing references later.
- Deleting a warehouse that has stock or operations is disabled, with a tooltip explaining why.

### 5.14 Settings: Location

- **List:** Full Name (mono, e.g. `WH/Stock1`) · Name · Short Code · Warehouse · Type badge (Internal / Vendor / Customer / Loss).
- **Form fields** (mockup): Name*, Short Code*, Warehouse* (select). A live preview of the full name appears underneath: `WH/Stock1`.
- **Virtual locations** (Vendor, Customer, Inventory Loss) are shown with a lock icon and can't be edited. This makes the location-based design visible in the UI.
- The page heading includes the mockup's explainer as subtext: *"Locations are the rooms, racks and shelves inside a warehouse."*

### 5.15 My Profile

- A card with a large avatar (initials), name, Login ID (mono, read-only), email, role badge, and "Member since".
- **Edit name** inline.
- A **Change Password** section: current password → new password with the rule checklist → confirm.
- **Logout** button at the bottom (danger ghost).

### 5.16 404 / Error Pages

- **404:** a 48px `PackageX` icon, *"This shelf is empty."*, *"The page you're looking for doesn't exist."*, and a **Back to Dashboard** button.
- **Network down:** a banner across the top: *"Can't reach the server. Retrying…"*. TanStack Query retries automatically.

---

## 6. Cross-Cutting Behaviour

### 6.1 Data Freshness
- After **any** mutation (validate, adjust, cancel), invalidate the `operations`, `stock`, `dashboard` and `moves` queries. Every screen stays consistent without a manual refresh. This is the "real-time" claim in the problem statement.
- Refetch the dashboard on window focus.

### 6.2 URL as State
- Search, filters, view (list/kanban), tab and page number all live in query params.
- Benefits: dashboard deep-links work, the back button behaves, and links can be shared.

### 6.3 Loading, Empty, Error: the three states every screen must design

| State | Pattern |
|---|---|
| Loading | Skeleton in the shape of the content. Never a full-page spinner. |
| Empty | `EmptyState` with a next action |
| Error | Inline message plus a **Retry** button. Toasts for action errors. |

### 6.4 Keyboard Shortcuts (show them with `?`)

| Key | Action |
|---|---|
| `/` | Focus search |
| `N` | New (on list pages) |
| `V` | Toggle list/kanban |
| `Ctrl/⌘ + S` | Save form |
| `Ctrl/⌘ + Enter` | Primary action (To Do / Validate) |
| `Esc` | Close drawer or modal |

### 6.5 Role-Aware UI
- **Staff** see Manager-only actions (delete product, edit warehouse) as **disabled with a tooltip**, "Only managers can do this", rather than hidden. Hiding them makes features look missing during judging.

### 6.6 Formatting Rules

| Data | Format |
|---|---|
| Date | `26 Sep 2026` |
| Date + time | `26 Sep 2026, 11:42` |
| Currency | `₹3,000.00`, Indian grouping |
| Quantity | Number + UoM (`6 Units`, `97 kg`), mono, right-aligned |
| Signed movement | `+6` green / `−3` red. Use the true minus sign `−`, not a hyphen. |
| Reference | Always mono, never truncated |

---

## 7. Microcopy Guide

- **Voice:** clear, calm, specific. Name the thing and the number.
- Button labels are verbs that describe the outcome: *Validate*, *Apply Adjustment*, *Create Receipt*. Never *Submit* or *OK*.
- Errors say **what happened and how to fix it**:
  - ❌ "Error 400"
  - ✅ "Only 4 Chairs available at WH/Stock1. Reduce the quantity or wait for stock."
- Success toasts include the **reference and the effect**: *"WH/OUT/0002 validated · Chair −4, Table −1"*.
- Confirm dialogs state the consequence: *"Validating will remove 5 items from WH/Stock1. Continue?"*

---

## 8. Accessibility & Responsiveness

**Accessibility**
- Text contrast is at least 4.5:1. `text-2` on `surface` passes; check `text-3` is used only for non-essential hints.
- Every interactive element is reachable by keyboard and has a visible coral focus ring.
- Status is shown with a **label + dot + position**, never color alone.
- Icon-only buttons (search, view toggle, print) have `aria-label`s.
- Form errors are linked with `aria-describedby`. Toasts use `role="status"`.

**Responsive breakpoints**

| Width | Behaviour |
|---|---|
| ≥ 1280px | Full layout (the demo target) |
| 1024–1279px | The dashboard's two cards stack their secondary counts; tables hide the Category and UoM columns |
| 768–1023px (tablet, warehouse staff) | The navbar collapses to a ☰ drawer. Tables become card lists. Kanban scrolls horizontally with snap. Buttons are 44px tall. |
| < 768px | Best-effort: a single column; forms stack their field pairs |

> **Designer's note:** Warehouse staff realistically use tablets on the floor, so tablet is the second priority after desktop. Mention this in the demo.

---

## 9. Frontend Folder Structure & Build Order

```
client/src/
├── app/            router.jsx, queryClient.js, AuthProvider.jsx
├── api/            axios.js, auth.js, operations.js, stock.js, moves.js, settings.js, dashboard.js
├── components/
│   ├── ui/         Button, Input, Select, Combobox, Badge, Modal, Drawer, Tooltip, Skeleton, Toast
│   ├── layout/     Navbar, AvatarMenu, PageHeader, FilterBar
│   ├── data/       DataTable, KanbanBoard, EmptyState
│   └── domain/     StatusBadge, StatusBar, KpiCard, ProductLineEditor, StockUpdatePopover, ProductDrawer
├── pages/
│   ├── auth/       Login, Signup, ForgotPassword
│   ├── Dashboard.jsx
│   ├── operations/ OperationList.jsx, OperationForm.jsx, PrintView.jsx   ← shared by Receipt & Delivery
│   ├── Adjustments.jsx
│   ├── Stock.jsx
│   ├── MoveHistory.jsx
│   ├── settings/   Warehouses.jsx, Locations.jsx
│   ├── Profile.jsx
│   └── NotFound.jsx
├── hooks/          useUrlFilters, useDebounce, useAuth, useKeyboardShortcuts
├── lib/            format.js (date, currency, qty), constants.js (statuses, icons, colors)
└── styles/         index.css (Tailwind + print.css)
shared/             validation.js (Zod schemas shared with the server)
```

**Build order** (maps to the phases in `phases.md`)

| Step | Build | Phase |
|---|---|---|
| 1 | Tokens in Tailwind, fonts, `format.js`, `constants.js` | 0 |
| 2 | Navbar, AvatarMenu, routes, auth pages | 1 |
| 3 | `ui/*`, PageHeader, FilterBar, DataTable, KanbanBoard, StatusBadge, StatusBar, ProductLineEditor | 2 |
| 4 | Stock page with ProductDrawer and inline update; Settings pages | 2 |
| 5 | OperationList and OperationForm (Receipt first, then Delivery), PrintView, Adjustments | 3 |
| 6 | Dashboard, Move History, Profile | 4 |
| 7 | Empty, loading and error states, shortcuts, responsive pass, pixel pass against the mockup | 5 |

---

## 10. Designer's QA Checklist

**Fidelity to the mockup**
- [ ] Navbar order: Dashboard · Operations · Stock · Move History · Settings, with the avatar at top-right
- [ ] List header: New · Title · Search · List/Kanban toggle, in that order
- [ ] Form header: New · Title / To Do|Validate · Print · Cancel, with the StatusBar at right
- [ ] Dashboard: Receipt card ("N to receive", Late, Operations) and Delivery card ("N to deliver", Late, Waiting, Operations)
- [ ] Stock columns: Product · Per unit cost · On hand · Free to use
- [ ] Move History: multiple rows per multi-product reference; IN green, OUT red
- [ ] Out-of-stock delivery lines are red, with an alert
- [ ] Print is available only when Done
- [ ] References follow `WH/IN/0001`

**Visual polish**
- [ ] No hard-coded colors; tokens only
- [ ] At most one coral primary button per region
- [ ] All numbers are mono, tabular and right-aligned
- [ ] Every status badge is identical across table, kanban and form
- [ ] Consistent 24px page padding and 12px card radius

**States**
- [ ] Every list has loading, empty and error states
- [ ] Every button has hover, focus, disabled (with a tooltip) and loading states
- [ ] Every mutation shows a toast with the reference and its effect

**Access and responsiveness**
- [ ] Keyboard-only walkthrough of the demo script works
- [ ] Tested at 1440px, 1280px and 1024px, plus a tablet layout
- [ ] Print preview looks clean on A4