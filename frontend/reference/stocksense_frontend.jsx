import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, SlidersHorizontal, Boxes, History,
  Search, List, LayoutGrid, Printer, Clock, AlertTriangle, Plus, X, Trash2, Pencil, Eye, EyeOff,
  Lock, ChevronDown, Check, LogOut, User, Info, PackageX, ArrowRight, AlertCircle, Download, MapPin,
  Warehouse as WarehouseIcon, Hourglass,
} from "lucide-react";

/* =====================================================================
   1. DESIGN TOKENS + GLOBAL CSS (mirrors frontend.md §2)
   ===================================================================== */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
.ss{--bg:#0F0F10;--s1:#17171A;--s2:#1F1F23;--s3:#27272C;--b:#2A2A30;--b2:#3A3A42;--t:#EDEDEF;--t2:#A1A1AA;--t3:#71717A;
--ac:#F47272;--ach:#F68A8A;--acp:#E05A5A;--acs:rgba(244,114,114,.12);--red:#FF5C5C;--green:#2FBF71;--amber:#F5A524;--blue:#4C8DFF;
font-family:Inter,ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;background:var(--bg);color:var(--t);min-height:100vh;font-size:14px;line-height:20px;-webkit-font-smoothing:antialiased}
.ss *{box-sizing:border-box}
.ss ul{list-style:none;margin:0;padding:0}
.mono{font-family:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;font-variant-numeric:tabular-nums}
.t2{color:var(--t2)}.t3{color:var(--t3)}
.card{background:var(--s1);border:1px solid var(--b);border-radius:12px}
.card-h{padding:14px 20px;border-bottom:1px solid var(--b);display:flex;align-items:center;justify-content:space-between;gap:12px}
.h-title{font-size:20px;line-height:28px;font-weight:600;letter-spacing:-.015em}
.h-sec{font-size:16px;line-height:24px;font-weight:600}
.lbl{display:block;font-size:12px;font-weight:500;color:var(--t2);margin-bottom:6px}
.upper{font-size:12px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:var(--t2)}
.btn{height:36px;padding:0 12px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;gap:6px;font-size:14px;font-weight:500;border:1px solid transparent;cursor:pointer;transition:background .12s,border-color .12s,color .12s;white-space:nowrap;font-family:inherit}
.btn:focus-visible,.inp:focus-visible,.navl:focus-visible,.ibtn:focus-visible,.lnk:focus-visible,.lnk2:focus-visible,.kcard:focus-visible{outline:2px solid var(--ac);outline-offset:2px}
.btn:disabled{opacity:.4;cursor:not-allowed}
.bp{background:var(--ac);color:#1A0B0B}.bp:hover:not(:disabled){background:var(--ach)}.bp:active:not(:disabled){background:var(--acp)}
.bs{background:var(--s2);border-color:var(--b2);color:var(--t)}.bs:hover:not(:disabled){background:var(--s3);border-color:#4E4E58}
.bd{background:transparent;border-color:var(--red);color:var(--red)}.bd:hover:not(:disabled){background:rgba(255,92,92,.1)}
.bg{background:transparent;color:var(--t2)}.bg:hover:not(:disabled){color:var(--t);background:var(--s2)}
.bo{background:transparent;border-color:var(--ac);color:var(--ac)}.bo:hover{background:var(--acs)}
.blg{height:44px}.bsm{height:30px;padding:0 10px;font-size:13px}
.ibtn{width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;color:var(--t2);background:transparent;border:0;cursor:pointer}.ibtn:hover{background:var(--s2);color:var(--t)}
.inp{height:36px;width:100%;background:var(--s2);border:1px solid var(--b2);border-radius:8px;padding:0 10px;color:var(--t);font-size:14px;font-family:inherit;outline:none}
.inp:focus{border-color:var(--ac)}.inp::placeholder{color:var(--t3)}.inp.err{border-color:var(--red)}.inp:disabled{opacity:.55;cursor:not-allowed}
textarea.inp{height:auto;padding:8px 10px;resize:vertical}
input[type=date].inp{color-scheme:dark}
select.inp{appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23A1A1AA' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:30px;cursor:pointer}
select.inp option{background:#27272C;color:#EDEDEF}
.chip{width:auto;height:32px;font-size:13px}
.srch{position:relative}.srch>svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--t3);pointer-events:none}.srch .inp{padding-left:32px}
.badge{display:inline-flex;align-items:center;gap:6px;height:22px;padding:0 8px;border-radius:999px;font-size:12px;font-weight:500;white-space:nowrap}
.badge i{width:6px;height:6px;border-radius:50%;background:currentColor;display:inline-block}
.tbl{width:100%;border-collapse:collapse}
.tbl th{height:36px;text-align:left;font-size:12px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:var(--t2);padding:0 16px;border-bottom:1px solid var(--b);white-space:nowrap}
.tbl td{height:44px;padding:0 16px;border-bottom:1px solid var(--b);font-size:13px}
.tbl tbody tr:last-child td{border-bottom:0}
.tbl tr.rc{cursor:pointer}.tbl tr.rc:hover td{background:var(--s2)}
.tbl .r{text-align:right}
.nav{height:56px;background:var(--s1);border-bottom:1px solid var(--b);display:flex;align-items:stretch;padding:0 24px;gap:32px;position:sticky;top:0;z-index:30}
.navl{display:flex;align-items:center;gap:4px;color:var(--t2);font-weight:500;cursor:pointer;background:none;border:0;font-size:14px;font-family:inherit;padding:0}
.navl:hover{color:var(--t)}.navl.on{color:var(--t);box-shadow:inset 0 -2px 0 var(--ac)}
.menu{position:absolute;top:calc(100% + 6px);min-width:210px;background:var(--s3);border:1px solid var(--b2);border-radius:10px;padding:6px;z-index:60;animation:fin .16s ease-out}
.mi{display:flex;align-items:center;gap:10px;width:100%;padding:8px 10px;border-radius:6px;color:var(--t);background:none;border:0;cursor:pointer;font-size:14px;text-align:left;font-family:inherit}
.mi:hover{background:var(--s2)}
.seg{display:inline-flex;background:var(--s2);border:1px solid var(--b2);border-radius:8px;padding:2px;gap:2px}
.seg button{height:28px;min-width:32px;padding:0 8px;border-radius:6px;border:0;background:none;color:var(--t2);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;font-size:13px;font-family:inherit}
.seg button.on{background:var(--acs);color:var(--ac)}
.tabs{display:flex;gap:24px;flex-wrap:wrap}
.tab{height:40px;display:inline-flex;align-items:center;gap:8px;color:var(--t2);background:none;border:0;cursor:pointer;font-size:14px;font-family:inherit;padding:0}
.tab:hover{color:var(--t)}.tab.on{color:var(--t);box-shadow:inset 0 -2px 0 var(--ac)}
.cnt{font-size:11px;padding:0 6px;height:18px;line-height:18px;border-radius:999px;background:var(--s2);color:var(--t2)}
.scrim{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:70}
.drawer{position:fixed;top:0;right:0;bottom:0;width:480px;max-width:100vw;background:var(--s3);border-left:1px solid var(--b2);z-index:80;display:flex;flex-direction:column;animation:slin .16s ease-out}
.modal{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:540px;max-width:calc(100vw - 32px);max-height:calc(100vh - 48px);overflow:auto;background:var(--s3);border:1px solid var(--b2);border-radius:12px;z-index:80}
@keyframes slin{from{transform:translateX(24px);opacity:0}to{transform:none;opacity:1}}
@keyframes fin{from{transform:translateY(-4px);opacity:0}to{transform:none;opacity:1}}
@keyframes shk{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.shake{animation:shk .3s}
.toasts{position:fixed;top:68px;right:24px;z-index:100;display:flex;flex-direction:column;gap:8px}
.toast{min-width:280px;max-width:400px;background:var(--s3);border:1px solid var(--b2);border-left:3px solid var(--green);border-radius:8px;padding:10px 14px;font-size:13px;animation:fin .16s ease-out}
.toast.error{border-left-color:var(--red)}.toast.info{border-left-color:var(--blue)}
.late{display:inline-flex;align-items:center;gap:4px;height:20px;padding:0 7px;border-radius:999px;background:rgba(255,92,92,.12);color:var(--red);font-size:11px;font-weight:500;white-space:nowrap;font-family:Inter,sans-serif}
.banner{display:flex;gap:10px;align-items:flex-start;padding:10px 14px;border-radius:8px;font-size:13px}
.banner.warn{background:rgba(245,165,36,.1);border-left:3px solid var(--amber)}
.banner.err{background:rgba(255,92,92,.1);border-left:3px solid var(--red);color:#FFB4AE}
.banner.info{background:rgba(76,141,255,.1);border-left:3px solid var(--blue)}
.lnk{color:var(--ac);background:none;border:0;cursor:pointer;font-size:inherit;font-family:inherit;padding:0}.lnk:hover{text-decoration:underline}
.lnk2{color:var(--t2);background:none;border:0;cursor:pointer;font-family:inherit;font-size:inherit;padding:0}.lnk2:hover{color:var(--t)}
.kcol{background:var(--s2);border-radius:12px;padding:10px;min-width:250px;flex:1}
.kcard{background:var(--s1);border:1px solid var(--b);border-radius:10px;padding:12px;cursor:pointer;margin-top:8px}.kcard:hover{border-color:#4E4E58}
.bar{height:4px;background:var(--s2);border-radius:99px;overflow:hidden}.bar>div{height:100%;border-radius:99px}
.otp{width:48px;height:56px;text-align:center;font-size:24px;padding:0}
.glow{position:fixed;inset:0;background:radial-gradient(circle at 50% 45%,rgba(244,114,114,.07),transparent 45%);pointer-events:none}
.cb{width:16px;height:16px;accent-color:#F47272;cursor:pointer}
.doc{background:#fff;color:#111;font-family:Inter,system-ui,sans-serif}
.doc table{width:100%;border-collapse:collapse}.doc th,.doc td{border-bottom:1px solid #ddd;padding:8px 10px;text-align:left;font-size:13px}
.doc th{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#555}
@media print{.no-print{display:none!important}.ss{background:#fff!important}.doc{box-shadow:none!important;margin:0!important}}
@media (prefers-reduced-motion:reduce){.drawer,.toast,.menu,.shake{animation:none}}
`;

/* =====================================================================
   2. CONSTANTS & FORMATTERS
   ===================================================================== */
const COL = { red: "#FF5C5C", green: "#2FBF71", amber: "#F5A524", blue: "#4C8DFF", gray: "#8B8B94", t2: "#A1A1AA", t3: "#71717A" };
const STATUS = {
  DRAFT: { label: "Draft", c: "#8B8B94" },
  WAITING: { label: "Waiting", c: "#F5A524" },
  READY: { label: "Ready", c: "#4C8DFF" },
  DONE: { label: "Done", c: "#2FBF71" },
  CANCELED: { label: "Canceled", c: "#8B8B94", bg: "#5C5C66" },
};
const TYPE_CODE = { RECEIPT: "IN", DELIVERY: "OUT", INTERNAL: "INT", ADJUSTMENT: "ADJ" };
const TYPE_LABEL = { RECEIPT: "Receipt", DELIVERY: "Delivery", INTERNAL: "Internal Transfer", ADJUSTMENT: "Adjustment" };
const PENDING = ["DRAFT", "WAITING", "READY"];
const UOMS = ["Units", "kg", "m", "L", "Box"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WDL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY = 864e5;

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const dayOffset = (n, h = 10) => { const d = new Date(startOfToday() + n * DAY); d.setHours(h, 0, 0, 0); return d.getTime(); };
const pad = (n) => String(n).padStart(2, "0");
const fmtDate = (t) => { const d = new Date(t); return `${pad(d.getDate())} ${MON[d.getMonth()]} ${d.getFullYear()}`; };
const fmtDT = (t) => { const d = new Date(t); return `${fmtDate(t)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const toInput = (t) => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const fromInput = (s) => { if (!s) return null; const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d, 10).getTime(); };
const inr = (n) => "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inr0 = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
const fmtQty = (n) => Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const initials = (n = "") => n.split(/\s+/).filter(Boolean).map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "?";

/* =====================================================================
   3. INVENTORY ENGINE (mock backend — same rules as phases.md §2)
   Every stock change goes through validateOp(). Swap these for API calls later.
   ===================================================================== */
const fail = (m) => { throw new Error(m); };
const loc = (db, id) => db.locations.find((l) => l.id === id);
const prod = (db, id) => db.products.find((p) => p.id === id);
const getOp = (db, id) => db.operations.find((o) => o.id === id) || fail("Operation not found");
const userName = (db, id) => db.users.find((u) => u.id === id)?.name || "—";
const virtualId = (db, type) => db.locations.find((l) => l.type === type).id;
const qKey = (p, l) => `${p}:${l}`;
const qtyAt = (db, p, l) => db.quants[qKey(p, l)] || 0;
const internalLocs = (db, whId) => db.locations.filter((l) => l.type === "INTERNAL" && (!whId || l.warehouseId === whId));
const onHand = (db, p, whId) => internalLocs(db, whId).reduce((s, l) => s + qtyAt(db, p, l.id), 0);
const isOut = (o) => o.type === "DELIVERY" || o.type === "INTERNAL";
const reservedAt = (db, p, l, exclude) =>
  db.operations.filter((o) => o.status === "READY" && isOut(o) && o.sourceLocId === l && o.id !== exclude)
    .reduce((s, o) => s + o.lines.filter((x) => x.productId === p).reduce((a, x) => a + x.quantity, 0), 0);
const freeAt = (db, p, l, exclude) => qtyAt(db, p, l) - reservedAt(db, p, l, exclude);
const freeTotal = (db, p, whId) => internalLocs(db, whId).reduce((s, l) => s + freeAt(db, p, l.id), 0);
const shortLines = (db, op) => op.lines.filter((l) => freeAt(db, l.productId, op.sourceLocId, op.id) < l.quantity);
const isAvailable = (db, op) => shortLines(db, op).length === 0;
const isLate = (o) => PENDING.includes(o.status) && o.scheduledDate < startOfToday();
const isUpcoming = (o) => PENDING.includes(o.status) && o.scheduledDate >= startOfToday() + DAY;
const matchQ = (o, q) => (o.reference + " " + (o.contact || "")).toLowerCase().includes(q.trim().toLowerCase());
const dateOf = (o) => o.doneDate || o.scheduledDate;
const dirOf = (db, o) => {
  const s = loc(db, o.sourceLocId).type, t = loc(db, o.destLocId).type;
  return t === "INTERNAL" && s !== "INTERNAL" ? "IN" : s === "INTERNAL" && t !== "INTERNAL" ? "OUT" : "INT";
};
const DIR_COLOR = { IN: COL.green, OUT: COL.red, INT: COL.t2 };
const signed = (dir, q) => (dir === "IN" ? "+" : dir === "OUT" ? "−" : "⇄ ") + fmtQty(q);
const stockStatus = (oh, fr, min) => (oh <= 0 ? ["Out", COL.red] : fr <= min ? ["Low", COL.amber] : ["In stock", COL.green]);

function nextRef(db, whId, type) {
  const wh = db.warehouses.find((w) => w.id === whId) || fail("Warehouse not found");
  const k = `${whId}:${type}`; const n = db.seq[k] || 1; db.seq[k] = n + 1;
  return `${wh.shortCode}/${TYPE_CODE[type]}/${String(n).padStart(4, "0")}`;
}
function validateHeader(d) {
  if (d.sourceLocId === d.destLocId) fail("Source and destination must be different");
  if (!d.scheduledDate) fail("Schedule date is required");
  if (d.type === "RECEIPT" && !d.contact) fail("Receive From is required");
  if (d.type === "DELIVERY" && !d.deliveryAddress) fail("Delivery address is required");
  for (const l of d.lines) {
    if (!l.productId) fail("Select a product on every line");
    if (!(Number(l.quantity) > 0)) fail("Quantities must be greater than 0");
  }
  const ids = d.lines.map((l) => l.productId);
  if (new Set(ids).size !== ids.length) fail("Each product can appear only once");
}
function createOp(db, d, userId) {
  validateHeader(d);
  const op = {
    id: db.nextId++, reference: nextRef(db, d.warehouseId, d.type), type: d.type, status: "DRAFT",
    warehouseId: d.warehouseId, contact: d.contact || "", deliveryAddress: d.deliveryAddress || "",
    sourceLocId: d.sourceLocId, destLocId: d.destLocId, scheduledDate: d.scheduledDate, doneDate: null,
    responsibleId: userId, note: d.note || "", createdAt: Date.now(),
    lines: d.lines.map((l) => ({ productId: l.productId, quantity: Number(l.quantity) })),
  };
  db.operations.unshift(op);
  return op;
}
function updateOp(db, id, d) {
  const op = getOp(db, id);
  if (op.status !== "DRAFT") fail("Only draft operations can be edited");
  validateHeader(d);
  Object.assign(op, {
    contact: d.contact, deliveryAddress: d.deliveryAddress, scheduledDate: d.scheduledDate,
    sourceLocId: d.sourceLocId, destLocId: d.destLocId, warehouseId: d.warehouseId,
    lines: d.lines.map((l) => ({ productId: l.productId, quantity: Number(l.quantity) })),
  });
  return op;
}
function todoOp(db, id) {
  const op = getOp(db, id);
  if (op.status !== "DRAFT") fail("Only draft operations can be marked To Do");
  if (!op.lines.length) fail("Add at least one product");
  op.status = op.type === "RECEIPT" || isAvailable(db, op) ? "READY" : "WAITING";
  return op;
}
function recheckWaiting(db) {
  const promoted = [];
  db.operations.filter((o) => o.status === "WAITING").sort((a, b) => a.scheduledDate - b.scheduledDate)
    .forEach((o) => { if (isAvailable(db, o)) { o.status = "READY"; promoted.push(o.reference); } });
  return promoted;
}
function checkAvail(db, id) {
  const op = getOp(db, id);
  if (op.status !== "WAITING") fail("Only waiting operations can be re-checked");
  if (isAvailable(db, op)) op.status = "READY";
  return op;
}
function validateOp(db, id, userId, at = Date.now()) {
  const op = getOp(db, id);
  if (op.status !== "READY") fail(`Cannot validate a ${STATUS[op.status].label} operation`);
  if (!op.lines.length) fail("Add at least one product");
  const src = loc(db, op.sourceLocId), dst = loc(db, op.destLocId);
  for (const l of op.lines)
    if (src.type === "INTERNAL" && qtyAt(db, l.productId, src.id) < l.quantity)
      fail(`Insufficient stock for ${prod(db, l.productId).name} at ${src.fullName}`);
  for (const l of op.lines) {
    if (src.type === "INTERNAL") db.quants[qKey(l.productId, src.id)] = qtyAt(db, l.productId, src.id) - l.quantity;
    if (dst.type === "INTERNAL") db.quants[qKey(l.productId, dst.id)] = qtyAt(db, l.productId, dst.id) + l.quantity;
    db.moves.unshift({ id: db.nextId++, operationId: op.id, reference: op.reference, productId: l.productId,
      sourceLocId: src.id, destLocId: dst.id, quantity: l.quantity, userId, createdAt: at });
  }
  op.status = "DONE"; op.doneDate = at;
  return { op, promoted: recheckWaiting(db) };
}
function cancelOp(db, id) {
  const op = getOp(db, id);
  if (!PENDING.includes(op.status)) fail(`Cannot cancel a ${STATUS[op.status].label} operation`);
  op.status = "CANCELED";
  recheckWaiting(db);
  return op;
}
function adjust(db, { productId, locationId, counted, reason }, userId, at = Date.now()) {
  if (!productId) fail("Select a product");
  if (counted === "" || isNaN(Number(counted)) || Number(counted) < 0) fail("Enter a valid counted quantity");
  const cur = qtyAt(db, productId, locationId), diff = Number(counted) - cur;
  if (diff === 0) fail("No change to apply");
  const l = loc(db, locationId), loss = virtualId(db, "LOSS");
  const op = createOp(db, {
    type: "ADJUSTMENT", warehouseId: l.warehouseId, scheduledDate: at, note: reason || "Count correction",
    sourceLocId: diff > 0 ? loss : locationId, destLocId: diff > 0 ? locationId : loss,
    lines: [{ productId, quantity: Math.abs(diff) }],
  }, userId);
  op.status = "READY";
  validateOp(db, op.id, userId, at);
  return { op, diff };
}
function saveProduct(db, d, userId) {
  const name = d.name.trim(), sku = d.sku.trim().toUpperCase();
  if (!name) fail("Name is required");
  if (!/^[A-Z0-9-]{3,12}$/.test(sku)) fail("SKU must be 3–12 letters, numbers or dashes");
  if (db.products.some((p) => p.sku === sku && p.id !== d.id)) fail(`SKU ${sku} already exists`);
  const cost = Number(d.unitCost || 0), mn = Number(d.reorderMin || 0), mx = Number(d.reorderMax || 0);
  if (cost < 0 || mn < 0 || mx < 0) fail("Values cannot be negative");
  if (mx && mx < mn) fail("Reorder max must be at least the min");
  let categoryId = null; const cn = (d.category || "").trim();
  if (cn) {
    let c = db.categories.find((x) => x.name.toLowerCase() === cn.toLowerCase());
    if (!c) { c = { id: db.nextId++, name: cn }; db.categories.push(c); }
    categoryId = c.id;
  }
  const fields = { name, sku, categoryId, uom: d.uom, unitCost: cost, reorderMin: mn, reorderMax: mx };
  if (d.id) { Object.assign(prod(db, d.id), fields); return { id: d.id }; }
  const p = { id: db.nextId++, createdAt: Date.now(), ...fields };
  db.products.push(p);
  const init = Number(d.initial || 0);
  if (init < 0) fail("Initial stock cannot be negative");
  if (init > 0) { // initial stock goes through a real receipt, so it appears in the ledger
    const l = loc(db, Number(d.locationId));
    const op = createOp(db, { type: "RECEIPT", contact: "Opening stock", sourceLocId: virtualId(db, "VENDOR"), destLocId: l.id,
      warehouseId: l.warehouseId, scheduledDate: Date.now(), lines: [{ productId: p.id, quantity: init }] }, userId);
    todoOp(db, op.id); validateOp(db, op.id, userId);
    return { id: p.id, ref: op.reference };
  }
  return { id: p.id };
}
function saveWarehouse(db, d) {
  const name = d.name.trim(), code = d.shortCode.trim().toUpperCase();
  if (!name) fail("Name is required");
  if (!/^[A-Z0-9]{2,5}$/.test(code)) fail("Short code must be 2–5 letters or numbers");
  if (db.warehouses.some((w) => w.shortCode === code && w.id !== d.id)) fail(`Short code ${code} is already used`);
  if (d.id) {
    const w = db.warehouses.find((x) => x.id === d.id);
    if (w.shortCode !== code) {
      if (db.operations.some((o) => o.warehouseId === w.id)) fail("Short code can't change after the first operation");
      w.shortCode = code;
      db.locations.filter((l) => l.warehouseId === w.id).forEach((l) => (l.fullName = `${code}/${l.shortCode}`));
    }
    w.name = name; w.address = d.address;
    return w;
  }
  const w = { id: db.nextId++, name, shortCode: code, address: d.address };
  db.warehouses.push(w);
  db.locations.push({ id: db.nextId++, name: "Stock", shortCode: "Stock", fullName: `${code}/Stock`, type: "INTERNAL", warehouseId: w.id });
  return w;
}
function saveLocation(db, d) {
  const name = d.name.trim(), code = d.shortCode.trim();
  if (!name) fail("Name is required");
  if (!/^[A-Za-z0-9-]{2,12}$/.test(code)) fail("Short code must be 2–12 letters, numbers or dashes");
  const wh = db.warehouses.find((w) => w.id === Number(d.warehouseId)) || fail("Select a warehouse");
  if (db.locations.some((l) => l.warehouseId === wh.id && l.shortCode.toLowerCase() === code.toLowerCase() && l.id !== d.id))
    fail(`${wh.shortCode}/${code} already exists`);
  const fields = { name, shortCode: code, warehouseId: wh.id, fullName: `${wh.shortCode}/${code}` };
  if (d.id) { Object.assign(loc(db, d.id), fields); return loc(db, d.id); }
  const l = { id: db.nextId++, type: "INTERNAL", ...fields };
  db.locations.push(l);
  return l;
}

/* ---------- Seed data built THROUGH the engine, so the ledger is consistent ---------- */
function buildSeed() {
  const db = {
    nextId: 1000, seq: {}, quants: {}, moves: [], operations: [],
    users: [
      { id: 1, loginId: "arjunk", name: "Arjun Kumar", email: "arjun@stocksense.in", password: "Admin@123", role: "MANAGER", createdAt: dayOffset(-30) },
      { id: 2, loginId: "priyas", name: "Priya Sharma", email: "priya@stocksense.in", password: "Staff@123", role: "STAFF", createdAt: dayOffset(-20) },
    ],
    warehouses: [
      { id: 1, name: "Main Warehouse", shortCode: "WH", address: "Plot 14, MIDC, Pune" },
      { id: 2, name: "Secondary Warehouse", shortCode: "WH2", address: "Sector 5, Noida" },
    ],
    locations: [
      { id: 1, name: "Stock 1", shortCode: "Stock1", fullName: "WH/Stock1", type: "INTERNAL", warehouseId: 1 },
      { id: 2, name: "Stock 2", shortCode: "Stock2", fullName: "WH/Stock2", type: "INTERNAL", warehouseId: 1 },
      { id: 3, name: "Rack A", shortCode: "RackA", fullName: "WH/RackA", type: "INTERNAL", warehouseId: 1 },
      { id: 4, name: "Stock 1", shortCode: "Stock1", fullName: "WH2/Stock1", type: "INTERNAL", warehouseId: 2 },
      { id: 90, name: "Vendors", shortCode: "", fullName: "Vendor", type: "VENDOR", warehouseId: null },
      { id: 91, name: "Customers", shortCode: "", fullName: "Customer", type: "CUSTOMER", warehouseId: null },
      { id: 92, name: "Inventory Loss", shortCode: "", fullName: "Inventory Loss", type: "LOSS", warehouseId: null },
    ],
    categories: [{ id: 1, name: "Furniture" }, { id: 2, name: "Raw Material" }, { id: 3, name: "Hardware" }, { id: 4, name: "Consumables" }],
    products: [
      { id: 1, sku: "DESK001", name: "Desk", categoryId: 1, uom: "Units", unitCost: 3000, reorderMin: 10, reorderMax: 60 },
      { id: 2, sku: "TBL003", name: "Table", categoryId: 1, uom: "Units", unitCost: 3000, reorderMin: 10, reorderMax: 60 },
      { id: 3, sku: "CHR002", name: "Chair", categoryId: 1, uom: "Units", unitCost: 850, reorderMin: 10, reorderMax: 40 },
      { id: 4, sku: "STL010", name: "Steel Rods", categoryId: 2, uom: "kg", unitCost: 62, reorderMin: 20, reorderMax: 150 },
      { id: 5, sku: "BLT005", name: "Bolts M8", categoryId: 3, uom: "Box", unitCost: 120, reorderMin: 50, reorderMax: 120 },
      { id: 6, sku: "PNT007", name: "Paint 1L", categoryId: 4, uom: "L", unitCost: 340, reorderMin: 15, reorderMax: 100 },
      { id: 7, sku: "PLY004", name: "Plywood Sheet", categoryId: 2, uom: "Units", unitCost: 1450, reorderMin: 5, reorderMax: 30 },
    ],
  };
  const U = 1;
  const mk = (type, o) => createOp(db, { contact: "", deliveryAddress: "", warehouseId: 1, ...o,
    lines: o.lines.map(([p, q]) => ({ productId: p, quantity: q })) }, U);
  const done = (op, at) => { todoOp(db, op.id); validateOp(db, op.id, U, at); };
  // history (Done)
  done(mk("RECEIPT", { contact: "Azure Interior", sourceLocId: 90, destLocId: 1, scheduledDate: dayOffset(-6), lines: [[1, 50], [2, 50]] }), dayOffset(-6, 11));
  done(mk("RECEIPT", { contact: "Steel Mart", sourceLocId: 90, destLocId: 1, scheduledDate: dayOffset(-5), lines: [[4, 100], [5, 12]] }), dayOffset(-5, 12));
  done(mk("RECEIPT", { contact: "Kumar Traders", sourceLocId: 90, destLocId: 1, scheduledDate: dayOffset(-4), lines: [[3, 10], [6, 80]] }), dayOffset(-4, 10));
  done(mk("INTERNAL", { sourceLocId: 1, destLocId: 3, scheduledDate: dayOffset(-3), lines: [[4, 40]] }), dayOffset(-3, 9));
  done(mk("DELIVERY", { contact: "Azure Interior", deliveryAddress: "12 MG Road, Pune", sourceLocId: 1, destLocId: 91, scheduledDate: dayOffset(-3), lines: [[3, 6]] }), dayOffset(-3, 16));
  done(mk("DELIVERY", { contact: "Sharma & Co", deliveryAddress: "44 Industrial Area, Ludhiana", sourceLocId: 1, destLocId: 91, scheduledDate: dayOffset(-2), lines: [[4, 57]] }), dayOffset(-2, 14));
  done(mk("DELIVERY", { contact: "Kumar Traders", deliveryAddress: "7 Mall Road, Jalandhar", sourceLocId: 1, destLocId: 91, scheduledDate: dayOffset(-1), lines: [[6, 10]] }), dayOffset(-1, 12));
  adjust(db, { productId: 4, locationId: 3, counted: 37, reason: "Damaged" }, U, dayOffset(-1, 15));
  // pending work
  todoOp(db, mk("RECEIPT", { contact: "Vendor Co.", sourceLocId: 90, destLocId: 3, scheduledDate: dayOffset(-1), lines: [[5, 50]] }).id);
  todoOp(db, mk("RECEIPT", { contact: "Steel Mart", sourceLocId: 90, destLocId: 1, scheduledDate: dayOffset(1), lines: [[4, 60]] }).id);
  mk("RECEIPT", { contact: "Kumar Traders", sourceLocId: 90, destLocId: 1, scheduledDate: dayOffset(2), lines: [[3, 20]] });
  cancelOp(db, mk("RECEIPT", { contact: "Azure Interior", sourceLocId: 90, destLocId: 1, scheduledDate: dayOffset(-2), lines: [[1, 5]] }).id);
  todoOp(db, mk("DELIVERY", { contact: "Azure Interior", deliveryAddress: "12 MG Road, Pune", sourceLocId: 1, destLocId: 91, scheduledDate: dayOffset(1), lines: [[1, 5]] }).id);
  todoOp(db, mk("DELIVERY", { contact: "Sharma & Co", deliveryAddress: "44 Industrial Area, Ludhiana", sourceLocId: 1, destLocId: 91, scheduledDate: dayOffset(-1), lines: [[3, 10], [1, 2]] }).id);
  mk("DELIVERY", { contact: "Kumar Traders", deliveryAddress: "7 Mall Road, Jalandhar", sourceLocId: 1, destLocId: 91, scheduledDate: dayOffset(3), lines: [[2, 3]] });
  todoOp(db, mk("INTERNAL", { sourceLocId: 1, destLocId: 2, scheduledDate: dayOffset(1), lines: [[6, 10]] }).id);
  return db;
}

/* =====================================================================
   4. HOOKS & UI PRIMITIVES (frontend.md §3)
   ===================================================================== */
function useOutside(ref, fn) {
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) fn(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  });
}
function useEsc(fn) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && fn();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });
}
/* EnterBox: submits when Enter is pressed inside an input. In the real Vite app, use a native HTML form element instead. */
function EnterBox({ onSubmit, children, className, style }) {
  return (
    <div className={className} style={style}
      onKeyDown={(e) => { if (e.key === "Enter" && e.target.tagName === "INPUT") { e.preventDefault(); onSubmit(); } }}>
      {children}
    </div>
  );
}
const Badge = ({ s }) => {
  const x = STATUS[s];
  return <span className="badge" style={{ color: x.c, background: x.bg ? x.bg + "40" : x.c + "1F" }}><i />{x.label}</span>;
};
const Pill = ({ c, children }) => <span className="badge" style={{ color: c, background: c + "1F" }}><i />{children}</span>;
const LateTag = () => <span className="late"><Clock size={11} />Late</span>;
const PName = ({ p }) => p ? <span><span className="mono t2">[{p.sku}]</span> {p.name}</span> : <span className="t3">—</span>;
const Diamond = ({ s = 14 }) => <span aria-hidden="true" style={{ width: s, height: s, background: "var(--ac)", transform: "rotate(45deg)", borderRadius: 3, display: "inline-block" }} />;

function Field({ label, req, children, hint, error }) {
  return (
    <div>
      <label className="lbl">{label}{req && <span style={{ color: "var(--ac)" }}> *</span>}</label>
      {children}
      {error ? <div style={{ color: "var(--red)", fontSize: 12, marginTop: 4, display: "flex", gap: 4, alignItems: "center" }}><AlertCircle size={12} />{error}</div>
        : hint ? <div className="t3" style={{ fontSize: 12, marginTop: 4 }}>{hint}</div> : null}
    </div>
  );
}
const ReadVal = ({ children, mono }) => <div className={mono ? "mono" : ""} style={{ minHeight: 36, display: "flex", alignItems: "center", gap: 8 }}>{children || <span className="t3">—</span>}</div>;

function Drawer({ title, onClose, children, footer }) {
  useEsc(onClose);
  return (<>
    <div className="scrim" onClick={onClose} />
    <aside className="drawer" role="dialog" aria-label={typeof title === "string" ? title : "Panel"}>
      <div className="card-h" style={{ borderColor: "var(--b2)" }}><div className="h-sec">{title}</div>
        <button className="ibtn" aria-label="Close" onClick={onClose}><X size={18} /></button></div>
      <div style={{ padding: 20, overflow: "auto", flex: 1 }}>{children}</div>
      {footer && <div style={{ padding: 16, borderTop: "1px solid var(--b2)", display: "flex", justifyContent: "flex-end", gap: 8 }}>{footer}</div>}
    </aside>
  </>);
}
function Modal({ title, onClose, children, footer }) {
  useEsc(onClose);
  return (<>
    <div className="scrim" onClick={onClose} />
    <div className="modal" role="dialog" aria-label={title}>
      <div className="card-h" style={{ borderColor: "var(--b2)" }}><div className="h-sec">{title}</div>
        <button className="ibtn" aria-label="Close" onClick={onClose}><X size={18} /></button></div>
      <div style={{ padding: 20 }}>{children}</div>
      {footer && <div style={{ padding: 16, borderTop: "1px solid var(--b2)", display: "flex", justifyContent: "flex-end", gap: 8 }}>{footer}</div>}
    </div>
  </>);
}
function ConfirmDialog({ title, body, confirm = "Confirm", danger, onYes, onClose }) {
  useEsc(onClose);
  return (<>
    <div className="scrim" onClick={onClose} />
    <div className="modal" role="alertdialog" style={{ width: 420 }}>
      <div style={{ padding: 20 }}><div className="h-sec">{title}</div><div className="t2" style={{ marginTop: 8 }}>{body}</div></div>
      <div style={{ padding: "0 20px 20px", display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button className="btn bs" onClick={onClose}>Back</button>
        <button className={"btn " + (danger ? "bd" : "bp")} autoFocus onClick={() => { onClose(); onYes(); }}>{confirm}</button>
      </div>
    </div>
  </>);
}
function Dropdown({ trigger, children, align = "left" }) {
  const [o, setO] = useState(false); const r = useRef(null);
  useOutside(r, () => setO(false));
  return (
    <div ref={r} style={{ position: "relative", display: "flex" }}>
      {trigger(o, () => setO(!o))}
      {o && <div className="menu" style={align === "right" ? { right: 0 } : { left: 0 }} onClick={() => setO(false)}>{children}</div>}
    </div>
  );
}
const Empty = ({ icon: I = Boxes, title, sub, action }) => (
  <div style={{ padding: "48px 16px", textAlign: "center" }}>
    <I size={40} className="t3" style={{ margin: "0 auto" }} />
    <div className="h-sec" style={{ marginTop: 12 }}>{title}</div>
    {sub && <div className="t2" style={{ marginTop: 4 }}>{sub}</div>}
    {action && <div style={{ marginTop: 16 }}>{action}</div>}
  </div>
);
const SearchBox = ({ value, onChange, placeholder, w = 280 }) => (
  <div className="srch" style={{ width: w, maxWidth: "100%" }}><Search size={15} />
    <input className="inp" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} /></div>
);
const ViewToggle = ({ v, set }) => (
  <div className="seg" role="group" aria-label="View">
    <button className={v === "list" ? "on" : ""} onClick={() => set("list")} aria-label="List view" title="List view"><List size={16} /></button>
    <button className={v === "kanban" ? "on" : ""} onClick={() => set("kanban")} aria-label="Kanban view" title="Kanban view"><LayoutGrid size={16} /></button>
  </div>
);
const ChipSelect = ({ value, onChange, options, label }) => (
  <select className="inp chip" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
  </select>
);
function PageHeader({ onNew, newLabel = "New", title, sub, right, newDisabled, newTitle }) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap" style={{ marginBottom: 16 }}>
      <div className="flex items-center gap-3">
        {onNew && <button className="btn bs" onClick={onNew} disabled={newDisabled} title={newTitle}><Plus size={16} />{newLabel}</button>}
        <div><h1 className="h-title" style={{ margin: 0 }}>{title}</h1>{sub && <div className="t2" style={{ fontSize: 13 }}>{sub}</div>}</div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">{right}</div>
    </div>
  );
}
function StatusBar({ kind, status }) {
  if (status === "CANCELED") return <Badge s="CANCELED" />;
  const steps = kind === "RECEIPT" ? ["DRAFT", "READY", "DONE"] : ["DRAFT", "WAITING", "READY", "DONE"];
  const cur = steps.indexOf(status);
  return (
    <div className="flex items-center" aria-label={`Status: ${STATUS[status].label}`}>
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          {i > 0 && <span style={{ width: 18, height: 1, background: i <= cur ? "var(--t3)" : "var(--b2)" }} />}
          <span className="badge" style={i === cur ? { background: "var(--ac)", color: "#1A0B0B", transition: "all .2s" }
            : i < cur ? { color: "var(--t2)", border: "1px solid var(--b2)" } : { color: "var(--t3)", border: "1px dashed var(--b2)" }}>
            {i < cur && <Check size={12} />}{STATUS[s].label}
          </span>
        </div>
      ))}
    </div>
  );
}
function PwInput({ value, onChange, placeholder, autoFocus }) {
  const [s, setS] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input className="inp" type={s ? "text" : "password"} value={value} autoFocus={autoFocus} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ paddingRight: 40 }} />
      <button type="button" className="ibtn" style={{ position: "absolute", right: 2, top: 2 }} onClick={() => setS(!s)} aria-label={s ? "Hide password" : "Show password"}>{s ? <EyeOff size={16} /> : <Eye size={16} />}</button>
    </div>
  );
}
const PW_RULES = [["At least 8 characters", (p) => p.length >= 8], ["One lowercase letter", (p) => /[a-z]/.test(p)],
  ["One uppercase letter", (p) => /[A-Z]/.test(p)], ["One special character", (p) => /[^A-Za-z0-9]/.test(p)]];
const pwOk = (p) => PW_RULES.every(([, f]) => f(p));
const RuleList = ({ pw }) => (
  <ul style={{ marginTop: 8, display: "grid", gap: 4, fontSize: 12 }}>
    {PW_RULES.map(([t, f]) => { const ok = f(pw); return (
      <li key={t} style={{ display: "flex", gap: 6, alignItems: "center", color: ok ? "var(--green)" : "var(--t3)", transition: "color .12s" }}>
        {ok ? <Check size={13} /> : <X size={13} />}{t}</li>); })}
  </ul>
);
const Toasts = ({ list }) => (
  <div className="toasts no-print" role="status" aria-live="polite">
    {list.map((t) => <div key={t.id} className={"toast " + t.kind}>{t.msg}</div>)}
  </div>
);

/* =====================================================================
   5. APP SHELL
   ===================================================================== */
export default function App() {
  const [db, setDb] = useState(buildSeed);
  const [uid, setUid] = useState(null);
  const [route, setRoute] = useState({ name: "login" });
  const [toasts, setToasts] = useState([]);
  const [dlg, setDlg] = useState(null);

  const toast = (msg, kind = "success") => {
    const id = Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 6000 : 4000);
  };
  const go = (name, params = {}) => { setRoute({ name, ...params }); try { window.scrollTo(0, 0); } catch (e) { /* noop */ } };
  // run(): transactional mutation. Clone, apply, commit. Any thrown error becomes a toast and nothing changes.
  const run = (fn) => {
    try { const next = structuredClone(db); const res = fn(next); setDb(next); return { ok: true, res, db: next }; }
    catch (e) { toast(e.message, "error"); return { ok: false }; }
  };
  const user = db.users.find((u) => u.id === uid);
  const login = (u) => {
    setUid(u.id); go("dashboard");
    toast(`Welcome back, ${u.name.split(" ")[0]}.`);
    const low = db.products.filter((p) => { const oh = onHand(db, p.id); return oh <= 0 || freeTotal(db, p.id) <= p.reorderMin; }).length;
    if (low) setTimeout(() => toast(`${low} items are low or out of stock`, "info"), 400);
  };
  const logout = () => { setUid(null); go("login"); toast("Signed out.", "info"); };
  const ctx = { db, run, toast, go, route, user, login, logout, ask: setDlg };

  let page;
  if (!user) {
    page = route.name === "signup" ? <Signup ctx={ctx} /> : route.name === "forgot" ? <Forgot ctx={ctx} /> : <Login ctx={ctx} />;
  } else if (route.name === "print") {
    page = <PrintView ctx={ctx} id={route.id} />;
  } else {
    const P = { dashboard: Dashboard, opList: OperationList, opForm: OperationForm, adjustments: Adjustments, stock: Stock,
      moves: MoveHistory, settingsWh: Warehouses, settingsLoc: Locations, profile: Profile }[route.name] || NotFound;
    page = (<>
      <Navbar ctx={ctx} />
      <main style={{ padding: 24, maxWidth: 1440, margin: "0 auto" }}><P key={JSON.stringify(route)} ctx={ctx} {...route} /></main>
    </>);
  }
  return (
    <div className="ss">
      <style>{CSS}</style>
      {page}
      <Toasts list={toasts} />
      {dlg && <ConfirmDialog {...dlg} onClose={() => setDlg(null)} />}
    </div>
  );
}

function Navbar({ ctx }) {
  const { route, go, user, logout } = ctx; const n = route.name;
  const opsOn = ["opList", "opForm", "adjustments"].includes(n);
  const setOn = n.startsWith("settings");
  return (
    <header className="nav no-print">
      <button className="navl" style={{ color: "var(--t)", gap: 10, fontWeight: 600, fontSize: 15 }} onClick={() => go("dashboard")}><Diamond />StockSense</button>
      <nav style={{ display: "flex", gap: 24 }} aria-label="Main">
        <button className={"navl " + (n === "dashboard" ? "on" : "")} onClick={() => go("dashboard")}>Dashboard</button>
        <Dropdown trigger={(o, t) => <button className={"navl " + (opsOn ? "on" : "")} onClick={t} aria-expanded={o}>Operations<ChevronDown size={14} /></button>}>
          <button className="mi" onClick={() => go("opList", { type: "RECEIPT" })}><ArrowDownToLine size={16} className="t2" />Receipts</button>
          <button className="mi" onClick={() => go("opList", { type: "DELIVERY" })}><ArrowUpFromLine size={16} className="t2" />Deliveries</button>
          <button className="mi" onClick={() => go("opList", { type: "DELIVERY", kind: "INTERNAL" })}><ArrowLeftRight size={16} className="t2" />Internal Transfers</button>
          <button className="mi" onClick={() => go("adjustments")}><SlidersHorizontal size={16} className="t2" />Adjustments</button>
        </Dropdown>
        <button className={"navl " + (n === "stock" ? "on" : "")} onClick={() => go("stock")}>Stock</button>
        <button className={"navl " + (n === "moves" ? "on" : "")} onClick={() => go("moves")}>Move History</button>
        <Dropdown trigger={(o, t) => <button className={"navl " + (setOn ? "on" : "")} onClick={t} aria-expanded={o}>Settings<ChevronDown size={14} /></button>}>
          <button className="mi" onClick={() => go("settingsWh")}><WarehouseIcon size={16} className="t2" />Warehouse</button>
          <button className="mi" onClick={() => go("settingsLoc")}><MapPin size={16} className="t2" />Location</button>
        </Dropdown>
      </nav>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
        <Dropdown align="right" trigger={(o, t) => (
          <button onClick={t} aria-label="Account menu" aria-expanded={o} className="mono"
            style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--acs)", color: "var(--ac)", border: "1px solid var(--b2)", fontSize: 12, fontWeight: 600, cursor: "pointer", alignSelf: "center" }}>
            {initials(user.name)}</button>)}>
          <div style={{ padding: "8px 10px 10px", borderBottom: "1px solid var(--b2)", marginBottom: 6 }}>
            <div style={{ fontWeight: 600 }}>{user.name}</div>
            <div className="mono t2" style={{ fontSize: 12 }}>{user.loginId}</div>
            <div style={{ marginTop: 6 }}><Pill c={user.role === "MANAGER" ? COL.blue : COL.gray}>{user.role === "MANAGER" ? "Manager" : "Staff"}</Pill></div>
          </div>
          <button className="mi" onClick={() => go("profile")}><User size={16} className="t2" />My Profile</button>
          <button className="mi" style={{ color: "var(--red)" }} onClick={logout}><LogOut size={16} />Logout</button>
        </Dropdown>
      </div>
    </header>
  );
}

/* =====================================================================
   6. AUTH: Login · Sign Up · Forgot Password
   ===================================================================== */
function AuthShell({ children }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative" }}>
      <div className="glow" />
      <div style={{ width: 400, maxWidth: "100%", position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div className="flex items-center justify-center gap-3" style={{ fontSize: 24, fontWeight: 600 }}><Diamond s={16} />StockSense</div>
          <div className="t2" style={{ marginTop: 6 }}>Inventory, in real time</div>
        </div>
        <div className="card" style={{ padding: 32 }}>{children}</div>
      </div>
    </div>
  );
}
function Login({ ctx }) {
  const { db, go, login } = ctx;
  const [f, setF] = useState({ id: "", pw: "" }); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const submit = () => {
    if (!f.id || !f.pw || busy) return;
    setErr(""); setBusy(true);
    const u = db.users.find((x) => x.loginId.toLowerCase() === f.id.trim().toLowerCase() && x.password === f.pw);
    setTimeout(() => { setBusy(false); if (!u) { setErr("Invalid Login ID or Password."); setF((s) => ({ ...s, pw: "" })); return; } login(u); }, 300);
  };
  return (
    <AuthShell>
      <EnterBox onSubmit={submit} className="flex flex-col gap-4">
        {err && <div className="banner err" role="alert"><AlertCircle size={16} />{err}</div>}
        <Field label="Login ID"><input className="inp" autoFocus value={f.id} onChange={(e) => setF({ ...f, id: e.target.value })} placeholder="e.g. arjunk" /></Field>
        <Field label="Password"><PwInput value={f.pw} onChange={(v) => setF({ ...f, pw: v })} /></Field>
        <button className="btn bp blg" onClick={submit} disabled={busy || !f.id || !f.pw}>{busy ? "Signing in…" : "Sign In"}</button>
        <div className="flex items-center justify-center gap-3" style={{ fontSize: 13 }}>
          <button type="button" className="lnk2" onClick={() => go("forgot")}>Forgot password?</button>
          <span style={{ width: 1, height: 14, background: "var(--b2)" }} />
          <button type="button" className="lnk2" onClick={() => go("signup")}>Sign up</button>
        </div>
      </EnterBox>
      <div className="t3 mono" style={{ fontSize: 11, textAlign: "center", marginTop: 20 }}>Demo · arjunk / Admin@123 · priyas / Staff@123</div>
    </AuthShell>
  );
}
function Signup({ ctx }) {
  const { db, run, go, toast, login } = ctx;
  const [f, setF] = useState({ id: "", email: "", pw: "", pw2: "" }); const [err, setErr] = useState({});
  const idOk = f.id.length >= 6 && f.id.length <= 12 && /^[A-Za-z0-9._-]+$/.test(f.id);
  const emOk = /^\S+@\S+\.\S+$/.test(f.email);
  const missing = !idOk ? "Login ID must be 6–12 characters" : !emOk ? "Enter a valid email" : !pwOk(f.pw) ? "Complete all password rules" : f.pw !== f.pw2 ? "Passwords must match" : "";
  const submit = () => {
    if (missing) return;
    const E = {};
    if (db.users.some((u) => u.loginId.toLowerCase() === f.id.toLowerCase())) E.id = "This Login ID is taken.";
    if (db.users.some((u) => u.email.toLowerCase() === f.email.toLowerCase())) E.email = "This email is already registered.";
    setErr(E); if (Object.keys(E).length) return;
    // Demo choice: new accounts are Managers so judges can try every feature.
    const r = run((d) => { const u = { id: d.nextId++, loginId: f.id, name: f.id, email: f.email, password: f.pw, role: "MANAGER", createdAt: Date.now() }; d.users.push(u); return u; });
    if (r.ok) { login(r.res); toast("Account created."); }
  };
  return (
    <AuthShell>
      <EnterBox onSubmit={submit} className="flex flex-col gap-4">
        <div className="h-sec">Create your account</div>
        <Field label="Login ID" req error={err.id} hint="6–12 characters, must be unique">
          <div style={{ position: "relative" }}>
            <input className={"inp " + (err.id ? "err" : "")} autoFocus value={f.id} maxLength={12} onChange={(e) => setF({ ...f, id: e.target.value })} style={{ paddingRight: 52 }} />
            <span className="mono" style={{ position: "absolute", right: 10, top: 9, fontSize: 12, color: idOk ? "var(--green)" : "var(--t3)" }}>{f.id.length}/12</span>
          </div>
        </Field>
        <Field label="Email" req error={err.email}>
          <input className={"inp " + (err.email ? "err" : "")} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          {err.email && <button type="button" className="lnk" style={{ fontSize: 12, marginTop: 4 }} onClick={() => go("login")}>Sign in instead?</button>}
        </Field>
        <Field label="Password" req><PwInput value={f.pw} onChange={(v) => setF({ ...f, pw: v })} /><RuleList pw={f.pw} /></Field>
        <Field label="Re-enter Password" req error={f.pw2 && f.pw !== f.pw2 ? "Passwords don't match" : ""}>
          <PwInput value={f.pw2} onChange={(v) => setF({ ...f, pw2: v })} />
          {f.pw2 && f.pw === f.pw2 && <div style={{ color: "var(--green)", fontSize: 12, marginTop: 4, display: "flex", gap: 4, alignItems: "center" }}><Check size={12} />Passwords match</div>}
        </Field>
        <button className="btn bp blg" onClick={submit} disabled={!!missing} title={missing}>Sign Up</button>
        <div className="t2" style={{ fontSize: 13, textAlign: "center" }}>Already have an account? <button type="button" className="lnk" onClick={() => go("login")}>Sign in</button></div>
      </EnterBox>
    </AuthShell>
  );
}
function Forgot({ ctx }) {
  const { db, run, toast, go } = ctx;
  const [step, setStep] = useState(0); const [who, setWho] = useState(""); const [otp, setOtp] = useState(null);
  const [dg, setDg] = useState(Array(6).fill("")); const [att, setAtt] = useState(3); const [err, setErr] = useState("");
  const [shake, setShake] = useState(false); const [now, setNow] = useState(Date.now()); const [pw, setPw] = useState({ a: "", b: "" });
  const refs = useRef([]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const send = () => {
    const k = who.trim().toLowerCase(); if (!k) return;
    const u = db.users.find((x) => x.email.toLowerCase() === k || x.loginId.toLowerCase() === k);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setOtp({ code, uid: u?.id, email: u?.email || who.trim(), exp: Date.now() + 600000, sent: Date.now() });
    setDg(Array(6).fill("")); setAtt(3); setErr(""); setStep(1);
    toast("If an account exists, we've sent a code.", "info");
    setTimeout(() => refs.current[0]?.focus(), 50);
  };
  const setD = (i, v) => {
    const d = v.replace(/\D/g, ""); const nd = [...dg];
    if (d.length > 1) { d.slice(0, 6 - i).split("").forEach((c, j) => (nd[i + j] = c)); setDg(nd); refs.current[Math.min(i + d.length, 5)]?.focus(); return; }
    nd[i] = d; setDg(nd); if (d && i < 5) refs.current[i + 1]?.focus();
  };
  const verify = () => {
    if (dg.join("").length !== 6) return;
    if (otp.uid && dg.join("") === otp.code && now < otp.exp) { setErr(""); setStep(2); return; }
    const left = att - 1; setAtt(left); setShake(true); setTimeout(() => setShake(false), 350);
    setDg(Array(6).fill("")); refs.current[0]?.focus();
    if (now >= otp.exp) setErr("Code expired. Request a new one.");
    else if (left <= 0) { toast("Too many attempts. Request a new code.", "error"); setStep(0); }
    else setErr(`Incorrect code. ${left} attempt${left > 1 ? "s" : ""} left.`);
  };
  const reset = () => {
    if (!pwOk(pw.a) || pw.a !== pw.b) return;
    const r = run((d) => { d.users.find((u) => u.id === otp.uid).password = pw.a; });
    if (r.ok) { toast("Password updated. Please sign in."); go("login"); }
  };
  const rem = otp ? Math.max(0, otp.exp - now) : 0;
  const canResend = otp && now - otp.sent >= 30000;
  const mask = (e) => { const [a, b] = e.split("@"); return b ? `${a[0]}••••@${b}` : e; };
  return (
    <AuthShell>
      <div className="flex items-center justify-center gap-2" style={{ marginBottom: 20, fontSize: 12 }}>
        {["Email", "Verify", "New password"].map((s, k) => (
          <div key={s} className="flex items-center gap-2">
            {k > 0 && <span style={{ width: 18, height: 1, background: "var(--b2)" }} />}
            <span className="flex items-center gap-1" style={{ color: k === step ? "var(--ac)" : k < step ? "var(--t2)" : "var(--t3)", fontWeight: k === step ? 600 : 400 }}>
              {k < step ? <Check size={12} /> : <span className="mono">{k + 1}</span>}{s}</span>
          </div>))}
      </div>
      {step === 0 && (
        <EnterBox onSubmit={send} className="flex flex-col gap-4">
          <div><div className="h-sec">Reset your password</div><div className="t2" style={{ fontSize: 13, marginTop: 4 }}>Enter your email or Login ID and we'll send a 6-digit code.</div></div>
          <Field label="Email or Login ID"><input className="inp" autoFocus value={who} onChange={(e) => setWho(e.target.value)} /></Field>
          <button className="btn bp blg" onClick={send} disabled={!who.trim()}>Send code</button>
        </EnterBox>)}
      {step === 1 && (
        <EnterBox onSubmit={verify} className="flex flex-col gap-4">
          <div><div className="h-sec">Enter verification code</div><div className="t2" style={{ fontSize: 13, marginTop: 4 }}>We sent a 6-digit code to {mask(otp.email)}</div></div>
          <div className={"flex justify-between " + (shake ? "shake" : "")}>
            {dg.map((v, i) => (
              <input key={i} ref={(el) => (refs.current[i] = el)} className="inp otp mono" inputMode="numeric" aria-label={`Digit ${i + 1}`} value={v}
                onChange={(e) => setD(i, e.target.value)} onKeyDown={(e) => { if (e.key === "Backspace" && !dg[i] && i > 0) refs.current[i - 1]?.focus(); }} />))}
          </div>
          {err && <div style={{ color: "var(--red)", fontSize: 12 }}>{err}</div>}
          <div className="flex justify-between t2" style={{ fontSize: 12 }}>
            <span>Code expires in <span className="mono">{pad(Math.floor(rem / 60000))}:{pad(Math.floor((rem % 60000) / 1000))}</span></span>
            <button type="button" className="lnk" disabled={!canResend} style={{ opacity: canResend ? 1 : 0.4 }} onClick={send}>
              Resend code{!canResend && otp ? ` (0:${pad(Math.ceil((30000 - (now - otp.sent)) / 1000))})` : ""}</button>
          </div>
          <button className="btn bp blg" onClick={verify} disabled={dg.join("").length !== 6}>Verify</button>
          {otp.uid && <div className="mono t3" style={{ fontSize: 11, textAlign: "center" }}>Dev OTP: {otp.code}</div>}
        </EnterBox>)}
      {step === 2 && (
        <EnterBox onSubmit={reset} className="flex flex-col gap-4">
          <div className="h-sec">Set a new password</div>
          <Field label="New password" req><PwInput autoFocus value={pw.a} onChange={(v) => setPw({ ...pw, a: v })} /><RuleList pw={pw.a} /></Field>
          <Field label="Confirm new password" req error={pw.b && pw.a !== pw.b ? "Passwords don't match" : ""}><PwInput value={pw.b} onChange={(v) => setPw({ ...pw, b: v })} /></Field>
          <button className="btn bp blg" onClick={reset} disabled={!pwOk(pw.a) || pw.a !== pw.b}>Update password</button>
        </EnterBox>)}
      <div style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}><button className="lnk2" onClick={() => go("login")}>← Back to sign in</button></div>
    </AuthShell>
  );
}

/* =====================================================================
   7. DASHBOARD
   ===================================================================== */
function OpCard({ icon: I, title, n, label, onMain, stats, info }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span style={{ width: 32, height: 32, borderRadius: 8, background: "var(--s2)", border: "1px solid var(--b2)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><I size={16} /></span>
          <span className="h-sec">{title}</span>
        </div>
        <span title={info} className="t3" style={{ cursor: "help" }} aria-label={info}><Info size={16} /></span>
      </div>
      <div className="flex items-center justify-between gap-4 flex-wrap" style={{ marginTop: 18 }}>
        <button className="btn bo blg" style={{ padding: "0 18px", gap: 10 }} onClick={onMain}>
          <span className="mono" style={{ fontSize: 20, fontWeight: 600 }}>{n}</span>{label}<ArrowRight size={16} /></button>
        <div style={{ display: "grid", gap: 4, minWidth: 160 }}>
          {stats.map(([l, v, c, fn]) => (
            <button key={l} className="lnk2 flex items-center justify-between" style={{ gap: 24 }} onClick={fn}>
              <span>{l}</span><span className="mono" style={{ fontWeight: 600, color: v === 0 ? "var(--t3)" : c || "var(--t)" }}>{v}</span></button>))}
        </div>
      </div>
    </div>
  );
}
const Kpi = ({ label, value, icon: I, color, onClick }) => (
  <button onClick={onClick} className="card" style={{ padding: 16, textAlign: "left", cursor: "pointer", color: "inherit", fontFamily: "inherit" }}>
    <div className="flex items-center justify-between"><span className="t2" style={{ fontSize: 13 }}>{label}</span>{I && <I size={16} style={{ color: color || COL.t3 }} />}</div>
    <div className="mono" style={{ fontSize: 28, lineHeight: "36px", fontWeight: 600, marginTop: 8, color: color || "var(--t)" }}>{value}</div>
  </button>
);
const openOp = (go, o) => (o.type === "ADJUSTMENT" ? go("adjustments") : go("opForm", { id: o.id }));
function Dashboard({ ctx }) {
  const { db, go } = ctx;
  const [f, setF] = useState({ type: "", status: "", wh: "", cat: "", q: "" });
  const wh = f.wh ? Number(f.wh) : null, cat = f.cat ? Number(f.cat) : null;
  const ops = db.operations.filter((o) => (!wh || o.warehouseId === wh) && (!cat || o.lines.some((l) => prod(db, l.productId)?.categoryId === cat)));
  const card = (t) => { const x = ops.filter((o) => o.type === t); return {
    ready: x.filter((o) => o.status === "READY").length, late: x.filter(isLate).length,
    waiting: x.filter((o) => o.status === "WAITING").length, upcoming: x.filter(isUpcoming).length }; };
  const R = card("RECEIPT"), D = card("DELIVERY");
  const stats = db.products.filter((p) => !cat || p.categoryId === cat).map((p) => ({ p, oh: onHand(db, p.id, wh), fr: freeTotal(db, p.id, wh) }));
  const inStock = stats.filter((s) => s.oh > 0).length, low = stats.filter((s) => s.oh > 0 && s.fr <= s.p.reorderMin).length;
  const out = stats.filter((s) => s.oh <= 0).length, units = stats.reduce((a, s) => a + s.oh, 0);
  const transfers = ops.filter((o) => o.type === "INTERNAL" && PENDING.includes(o.status)).length;
  const recent = ops.filter((o) => (!f.type || o.type === f.type) && (!f.status || o.status === f.status) && (!f.q || matchQ(o, f.q)))
    .sort((a, b) => b.scheduledDate - a.scheduledDate).slice(0, 8);
  const alerts = stats.filter((s) => s.oh <= 0 || s.fr <= s.p.reorderMin).sort((a, b) => a.oh / (a.p.reorderMin || 1) - b.oh / (b.p.reorderMin || 1)).slice(0, 5);
  const mainLoc = (pid) => { const l = internalLocs(db, wh).slice().sort((a, b) => qtyAt(db, pid, b.id) - qtyAt(db, pid, a.id))[0]; return l && qtyAt(db, pid, l.id) > 0 ? l.fullName : "—"; };
  const days = [...Array(7)].map((_, i) => { const s = startOfToday() - (6 - i) * DAY; return { s, day: WD[new Date(s).getDay()], In: 0, Out: 0 }; });
  db.moves.forEach((m) => {
    const d = days.find((x) => m.createdAt >= x.s && m.createdAt < x.s + DAY); if (!d) return;
    const s = loc(db, m.sourceLocId), t = loc(db, m.destLocId);
    if (wh && s.warehouseId !== wh && t.warehouseId !== wh) return;
    if (t.type === "INTERNAL" && s.type !== "INTERNAL") d.In += m.quantity; else if (s.type === "INTERNAL" && t.type !== "INTERNAL") d.Out += m.quantity;
  });
  const createReorder = () => go("opForm", { type: "RECEIPT", prefill: alerts.map((s) => ({ productId: s.p.id, quantity: Math.max(s.p.reorderMax - s.oh, 1) })) });
  const today = new Date();
  const anyFilter = f.type || f.status || f.cat || f.q || f.wh;
  return (<>
    <PageHeader title="Dashboard" sub={`${WDL[today.getDay()]}, ${fmtDate(today)}`}
      right={<ChipSelect label="Warehouse" value={f.wh} onChange={(v) => setF({ ...f, wh: v })} options={[["", "Warehouse: All"], ...db.warehouses.map((w) => [String(w.id), `Warehouse: ${w.shortCode}`])]} />} />
    <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 16 }}>
      <ChipSelect label="Type" value={f.type} onChange={(v) => setF({ ...f, type: v })} options={[["", "Type: All"], ["RECEIPT", "Receipts"], ["DELIVERY", "Deliveries"], ["INTERNAL", "Internal"], ["ADJUSTMENT", "Adjustments"]]} />
      <ChipSelect label="Status" value={f.status} onChange={(v) => setF({ ...f, status: v })} options={[["", "Status: All"], ...Object.keys(STATUS).map((s) => [s, STATUS[s].label])]} />
      <ChipSelect label="Category" value={f.cat} onChange={(v) => setF({ ...f, cat: v })} options={[["", "Category: All"], ...db.categories.map((c) => [String(c.id), c.name])]} />
      <SearchBox value={f.q} onChange={(v) => setF({ ...f, q: v })} placeholder="Filter reference or contact" w={260} />
      {anyFilter && <button className="btn bg bsm" onClick={() => setF({ type: "", status: "", wh: "", cat: "", q: "" })}>Clear all</button>}
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <OpCard icon={ArrowDownToLine} title="Receipt" n={R.ready} label="to receive" onMain={() => go("opList", { type: "RECEIPT", preset: "READY" })}
        info="To receive: receipts ready to validate · Late: scheduled before today · Operations: scheduled after today"
        stats={[["Late", R.late, COL.red, () => go("opList", { type: "RECEIPT", preset: "LATE" })], ["Operations", R.upcoming, null, () => go("opList", { type: "RECEIPT", preset: "UPCOMING" })]]} />
      <OpCard icon={ArrowUpFromLine} title="Delivery" n={D.ready} label="to deliver" onMain={() => go("opList", { type: "DELIVERY", preset: "READY" })}
        info="To deliver: deliveries ready to validate · Late: scheduled before today · Waiting: waiting for stock · Operations: scheduled after today"
        stats={[["Late", D.late, COL.red, () => go("opList", { type: "DELIVERY", preset: "LATE" })], ["Waiting", D.waiting, COL.amber, () => go("opList", { type: "DELIVERY", preset: "WAITING" })],
          ["Operations", D.upcoming, null, () => go("opList", { type: "DELIVERY", preset: "UPCOMING" })]]} />
    </div>
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", marginTop: 16 }}>
      <Kpi label="Products in stock" value={inStock} icon={Boxes} onClick={() => go("stock")} />
      <Kpi label="Low stock" value={low} icon={AlertTriangle} color={low ? COL.amber : null} onClick={() => go("stock", { preset: "low" })} />
      <Kpi label="Out of stock" value={out} icon={PackageX} color={out ? COL.red : null} onClick={() => go("stock", { preset: "low" })} />
      <Kpi label="Transfers scheduled" value={transfers} icon={ArrowLeftRight} onClick={() => go("opList", { type: "DELIVERY", kind: "INTERNAL" })} />
      <Kpi label="Total units on hand" value={fmtQty(units)} onClick={() => go("stock")} />
    </div>
    <div className="grid gap-4" style={{ gridTemplateColumns: "minmax(0,2fr) minmax(280px,1fr)", marginTop: 16 }}>
      <div className="card">
        <div className="card-h"><div className="h-sec">Recent Operations</div><button className="lnk" style={{ fontSize: 13 }} onClick={() => go("moves")}>View all →</button></div>
        {recent.length ? (
          <table className="tbl"><thead><tr><th>Reference</th><th>Type</th><th>Contact</th><th>Schedule Date</th><th>Status</th></tr></thead>
            <tbody>{recent.map((o) => (
              <tr key={o.id} className="rc" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && openOp(go, o)} onClick={() => openOp(go, o)}>
                <td className="mono" style={{ fontWeight: 600 }}>{o.reference}</td><td className="t2">{TYPE_LABEL[o.type]}</td><td>{o.contact || <span className="t3">—</span>}</td>
                <td><span className="flex items-center gap-2"><span className="mono">{fmtDate(o.scheduledDate)}</span>{isLate(o) && <LateTag />}</span></td><td><Badge s={o.status} /></td>
              </tr>))}</tbody></table>
        ) : <Empty title="No matching operations" sub="Try clearing the filters." />}
      </div>
      <div className="card">
        <div className="card-h"><div className="h-sec flex items-center gap-2"><AlertTriangle size={16} style={{ color: COL.amber }} />Low Stock Alerts</div>
          {alerts.length > 0 && <Pill c={COL.amber}>{alerts.length}</Pill>}</div>
        <div style={{ padding: "4px 20px 20px" }}>
          {alerts.length ? alerts.map(({ p, oh, fr }) => {
            const c = oh <= 0 ? COL.red : COL.amber; const pct = Math.min(100, (Math.max(oh, 0) / Math.max(p.reorderMin, 1)) * 100);
            return (
              <div key={p.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--b)" }}>
                <div className="flex items-center justify-between gap-3">
                  <div><PName p={p} /><div className="mono t3" style={{ fontSize: 11 }}>{mainLoc(p.id)}</div></div>
                  <span className="mono" style={{ color: c, fontWeight: 600, whiteSpace: "nowrap" }}>{fmtQty(Math.max(fr, 0))} / min {p.reorderMin}</span>
                </div>
                <div className="bar" style={{ marginTop: 8 }}><div style={{ width: `${pct}%`, background: c }} /></div>
              </div>);
          }) : <Empty icon={Check} title="All stocked up" sub="Nothing below its reorder minimum." />}
          {alerts.length > 0 && <button className="btn bs" style={{ width: "100%", marginTop: 16 }} onClick={createReorder}><Plus size={16} />Create receipt</button>}
        </div>
      </div>
    </div>
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-h"><div><div className="h-sec">Stock In vs Out</div><div className="t2" style={{ fontSize: 13 }}>Last 7 days · units</div></div>
        <div className="flex gap-4" style={{ fontSize: 13 }}><span className="flex items-center gap-2"><i style={{ width: 8, height: 8, borderRadius: 9, background: COL.green, display: "inline-block" }} />Stock In</span>
          <span className="flex items-center gap-2"><i style={{ width: 8, height: 8, borderRadius: 9, background: COL.red, display: "inline-block" }} />Stock Out</span></div></div>
      <div style={{ height: 240, padding: "16px 12px 8px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={days} barGap={4} barCategoryGap="28%">
            <CartesianGrid stroke="#2A2A30" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "#71717A", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#71717A", fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
            <Tooltip cursor={{ fill: "rgba(255,255,255,.03)" }} contentStyle={{ background: "#27272C", border: "1px solid #3A3A42", borderRadius: 8, color: "#EDEDEF" }} />
            <Bar dataKey="In" fill={COL.green} radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="Out" fill={COL.red} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </>);
}

/* =====================================================================
   8. OPERATIONS: list (list + kanban) and detail
   ===================================================================== */
function OperationList({ ctx, type, preset, kind: k0 }) {
  const { db, go } = ctx;
  const [kind, setKind] = useState(k0 || type);
  const [tab, setTab] = useState(preset || "ALL"); const [q, setQ] = useState(""); const [wh, setWh] = useState("");
  const [view, setView] = useState("list"); const [showCanceled, setShowCanceled] = useState(false);
  const base = db.operations.filter((o) => o.type === kind && (!wh || o.warehouseId === Number(wh)));
  const tabs = [["ALL", "All"], ["DRAFT", "Draft"], ...(kind !== "RECEIPT" ? [["WAITING", "Waiting"]] : []), ["READY", "Ready"], ["DONE", "Done"], ["LATE", "Late"], ["UPCOMING", "Upcoming"]];
  const tabF = (t) => (o) => t === "ALL" ? true : t === "LATE" ? isLate(o) : t === "UPCOMING" ? isUpcoming(o) : o.status === t;
  const searched = base.filter((o) => !q || matchQ(o, q)).sort((a, b) => b.scheduledDate - a.scheduledDate);
  const rows = searched.filter(tabF(tab));
  const title = kind === "RECEIPT" ? "Receipts" : kind === "DELIVERY" ? "Deliveries" : "Internal Transfers";
  const cols = kind === "RECEIPT" ? ["DRAFT", "READY", "DONE"] : ["DRAFT", "WAITING", "READY", "DONE"];
  const canceled = searched.filter((o) => o.status === "CANCELED");
  return (<>
    <PageHeader onNew={() => go("opForm", { type: kind })} title={title}
      right={<><SearchBox value={q} onChange={setQ} placeholder="Search reference or contact" /><ViewToggle v={view} set={setView} /></>} />
    <div className="flex items-end justify-between gap-4 flex-wrap" style={{ marginBottom: 16, borderBottom: view === "list" ? "1px solid var(--b)" : "none" }}>
      {view === "list" ? (
        <div className="tabs" role="tablist">
          {tabs.map(([k, l]) => { const n = searched.filter(tabF(k)).length; return (
            <button key={k} role="tab" aria-selected={tab === k} className={"tab " + (tab === k ? "on" : "")} onClick={() => setTab(k)}>{l}
              <span className="cnt" style={k === "LATE" && n ? { background: "rgba(255,92,92,.15)", color: "var(--red)" } : undefined}>{n}</span></button>); })}
        </div>) : <div />}
      <div className="flex items-center gap-2" style={{ paddingBottom: 6 }}>
        {type === "DELIVERY" && (
          <div className="seg" role="group" aria-label="Operation type">
            <button className={kind === "DELIVERY" ? "on" : ""} onClick={() => setKind("DELIVERY")}><ArrowUpFromLine size={14} />Delivery</button>
            <button className={kind === "INTERNAL" ? "on" : ""} onClick={() => setKind("INTERNAL")}><ArrowLeftRight size={14} />Internal</button>
          </div>)}
        <ChipSelect label="Warehouse" value={wh} onChange={setWh} options={[["", "Warehouse: All"], ...db.warehouses.map((w) => [String(w.id), w.shortCode])]} />
      </div>
    </div>
    {view === "list" ? (
      <div className="card">
        {rows.length ? (<>
          <table className="tbl"><thead><tr><th>Reference</th><th>From</th><th>To</th><th>Contact</th><th>Schedule Date</th><th>Status</th></tr></thead>
            <tbody>{rows.map((o) => (
              <tr key={o.id} className="rc" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && go("opForm", { id: o.id })} onClick={() => go("opForm", { id: o.id })}>
                <td className="mono" style={{ fontWeight: 600, textDecoration: o.status === "CANCELED" ? "line-through" : "none", color: o.status === "CANCELED" ? "var(--t3)" : undefined }}>{o.reference}</td>
                <td className="mono t2">{loc(db, o.sourceLocId).fullName}</td><td className="mono t2">{loc(db, o.destLocId).fullName}</td>
                <td>{o.contact || <span className="t3">—</span>}</td>
                <td><span className="flex items-center gap-2"><span className="mono">{fmtDate(o.scheduledDate)}</span>{isLate(o) && <LateTag />}</span></td>
                <td><span className="flex items-center gap-2"><Badge s={o.status} />{o.status === "WAITING" && <span title="Waiting for stock"><Hourglass size={13} style={{ color: COL.amber }} /></span>}</span></td>
              </tr>))}</tbody></table>
          <div className="t2" style={{ padding: "12px 16px", borderTop: "1px solid var(--b)", fontSize: 13 }}>Showing <span className="mono">{rows.length}</span> of <span className="mono">{base.length}</span></div>
        </>) : base.length ? <Empty icon={Search} title="No matches" sub="Try a different search or tab." />
          : <Empty icon={kind === "RECEIPT" ? ArrowDownToLine : kind === "DELIVERY" ? ArrowUpFromLine : ArrowLeftRight} title={`No ${title.toLowerCase()} yet`}
            sub={kind === "RECEIPT" ? "Receipts record goods arriving from vendors." : kind === "DELIVERY" ? "Deliveries record goods leaving for customers." : "Transfers move stock between locations."}
            action={<button className="btn bp" onClick={() => go("opForm", { type: kind })}><Plus size={16} />New {TYPE_LABEL[kind]}</button>} />}
      </div>
    ) : (<>
      <div className="flex gap-3" style={{ overflowX: "auto", paddingBottom: 8, alignItems: "flex-start" }}>
        {[...cols, ...(showCanceled ? ["CANCELED"] : [])].map((s) => { const items = searched.filter((o) => o.status === s); return (
          <div key={s} className="kcol">
            <div className="flex items-center justify-between" style={{ padding: "2px 4px" }}>
              <span className="flex items-center gap-2" style={{ fontWeight: 500 }}><i style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS[s].c, display: "inline-block" }} />{STATUS[s].label}</span>
              <span className="cnt">{items.length}</span></div>
            {items.map((o) => (
              <div key={o.id} className="kcard" role="button" tabIndex={0} style={{ borderLeft: `3px solid ${STATUS[s].c}` }}
                onKeyDown={(e) => e.key === "Enter" && go("opForm", { id: o.id })} onClick={() => go("opForm", { id: o.id })}>
                <div className="mono" style={{ fontWeight: 600 }}>{o.reference}</div>
                <div className="t2" style={{ fontSize: 13, marginTop: 2 }}>{o.contact || "—"}</div>
                <div className="flex items-center justify-between" style={{ marginTop: 8, fontSize: 12 }}>
                  <span className="t2 flex items-center gap-2"><span className="mono">{fmtDate(o.scheduledDate)}</span>{isLate(o) && <LateTag />}</span>
                  <span className="t3">{o.lines.length} product{o.lines.length !== 1 ? "s" : ""}</span></div>
              </div>))}
            {!items.length && <div className="t3" style={{ fontSize: 12, padding: "12px 4px" }}>Nothing here</div>}
          </div>); })}
      </div>
      {canceled.length > 0 && <button className="lnk2" style={{ fontSize: 13, marginTop: 8 }} onClick={() => setShowCanceled(!showCanceled)}>{showCanceled ? "Hide" : "Show"} canceled ({canceled.length})</button>}
    </>)}
  </>);
}

function OperationForm({ ctx, id, type, prefill }) {
  const { db, run, toast, go, user, ask } = ctx;
  const op = id ? db.operations.find((o) => o.id === id) : null;
  const internals = internalLocs(db);
  const defaults = (t) => t === "RECEIPT" ? { sourceLocId: virtualId(db, "VENDOR"), destLocId: internals[0].id }
    : t === "DELIVERY" ? { sourceLocId: internals[0].id, destLocId: virtualId(db, "CUSTOMER") }
      : { sourceLocId: internals[0].id, destLocId: (internals[1] || internals[0]).id };
  const toLines = (ls) => ls.map((l, i) => ({ k: i + 1, productId: String(l.productId), quantity: String(l.quantity) }));
  const fromOp = (o) => ({ kind: o.type, contact: o.contact, deliveryAddress: o.deliveryAddress, scheduledDate: toInput(o.scheduledDate), sourceLocId: o.sourceLocId, destLocId: o.destLocId, lines: toLines(o.lines) });
  const [f, setF] = useState(() => op ? fromOp(op) : { kind: type || "RECEIPT", contact: "", deliveryAddress: "", scheduledDate: toInput(Date.now()), ...defaults(type || "RECEIPT"), lines: toLines(prefill || []) });
  const [pick, setPick] = useState({ picked: false, packed: false });
  useEffect(() => { if (op) setF(fromOp(op)); }, [op?.status]); // eslint-disable-line
  if (id && !op) return <NotFound ctx={ctx} />;

  const status = op ? op.status : "NEW";
  const editable = !op || op.status === "DRAFT";
  const kind = f.kind; const outgoing = kind !== "RECEIPT";
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const payload = () => {
    const intLoc = loc(db, Number(kind === "RECEIPT" ? f.destLocId : f.sourceLocId));
    return { type: kind, contact: f.contact.trim(), deliveryAddress: f.deliveryAddress.trim(), scheduledDate: fromInput(f.scheduledDate),
      sourceLocId: Number(f.sourceLocId), destLocId: Number(f.destLocId), warehouseId: intLoc.warehouseId,
      lines: f.lines.map((l) => ({ productId: Number(l.productId), quantity: Number(l.quantity) })) };
  };
  const units = f.lines.reduce((a, l) => a + (Number(l.quantity) || 0), 0);
  const dir = kind === "RECEIPT" ? "IN" : kind === "DELIVERY" ? "OUT" : "INT";
  const shortNow = outgoing && status !== "DONE" && status !== "CANCELED"
    ? f.lines.filter((l) => l.productId && Number(l.quantity) > freeAt(db, Number(l.productId), Number(f.sourceLocId), op?.id)) : [];
  const listName = kind === "RECEIPT" ? "Receipts" : kind === "DELIVERY" ? "Deliveries" : "Internal Transfers";
  const backList = () => go("opList", { type: kind === "RECEIPT" ? "RECEIPT" : "DELIVERY", ...(kind === "INTERNAL" ? { kind: "INTERNAL" } : {}) });

  const save = () => {
    const r = run((d) => op ? updateOp(d, op.id, payload()) : createOp(d, payload(), user.id));
    if (r.ok) { toast(`${r.res.reference} saved as Draft`); if (!op) go("opForm", { id: r.res.id }); }
  };
  const todo = () => {
    const r = run((d) => { const o = op ? updateOp(d, op.id, payload()) : createOp(d, payload(), user.id); todoOp(d, o.id); return { o, short: shortLines(d, o) }; });
    if (!r.ok) return;
    const { o, short } = r.res;
    if (o.status === "READY") toast(`${o.reference} is Ready${kind === "RECEIPT" ? " to receive" : ""}`);
    else toast(`${o.reference} is Waiting for stock · ${short.map((l) => prod(r.db, l.productId).name).join(", ")}`, "info");
    if (!op) go("opForm", { id: o.id });
  };
  const validate = () => ask({
    title: `Validate ${op.reference}?`, confirm: "Validate",
    body: kind === "RECEIPT" ? `This will add ${fmtQty(units)} items to ${loc(db, op.destLocId).fullName}.`
      : kind === "DELIVERY" ? `This will remove ${fmtQty(units)} items from ${loc(db, op.sourceLocId).fullName}.`
        : `This will move ${fmtQty(units)} items from ${loc(db, op.sourceLocId).fullName} to ${loc(db, op.destLocId).fullName}.`,
    onYes: () => {
      const r = run((d) => validateOp(d, op.id, user.id));
      if (!r.ok) return;
      toast(`${op.reference} validated · ${op.lines.map((l) => `${prod(db, l.productId).name} ${signed(dir, l.quantity)}`).join(", ")}`);
      if (r.res.promoted.length) setTimeout(() => toast(`Stock arrived · now Ready: ${r.res.promoted.join(", ")}`, "info"), 300);
    },
  });
  const recheck = () => { const r = run((d) => checkAvail(d, op.id)); if (r.ok) toast(r.res.status === "READY" ? `${op.reference} is now Ready` : "Still waiting for stock", r.res.status === "READY" ? "success" : "info"); };
  const cancel = () => op ? ask({ title: `Cancel ${op.reference}?`, body: "This can't be undone. Reserved stock will be released.", confirm: "Cancel operation", danger: true,
    onYes: () => { const r = run((d) => cancelOp(d, op.id)); if (r.ok) toast(`${op.reference} canceled`, "info"); } }) : backList();
  const pickOk = kind !== "DELIVERY" || (pick.picked && pick.packed);
  const locSel = (key) => editable
    ? <select className="inp mono" value={f[key]} onChange={(e) => set(key, Number(e.target.value))}>{internals.map((l) => <option key={l.id} value={l.id}>{l.fullName}</option>)}</select>
    : <ReadVal mono>{loc(db, Number(f[key]))?.fullName}</ReadVal>;
  const responsible = <ReadVal><Lock size={14} className="t3" /><span className="t2">{op ? userName(db, op.responsibleId) : user.name}</span><span className="t3" style={{ fontSize: 12 }}>(auto)</span></ReadVal>;
  const dateField = <Field label="Schedule Date" req>{editable ? <input className="inp" type="date" value={f.scheduledDate} onChange={(e) => set("scheduledDate", e.target.value)} /> : <ReadVal mono>{fmtDate(op.scheduledDate)}</ReadVal>}</Field>;
  const txt = (key, label, req, ph) => <Field label={label} req={req}>{editable ? <input className="inp" value={f[key]} placeholder={ph} onChange={(e) => set(key, e.target.value)} /> : <ReadVal>{f[key]}</ReadVal>}</Field>;
  const opType = <Field label="Operation Type">{!op ? (
    <select className="inp" value={kind} onChange={(e) => { const v = e.target.value; setF((s) => ({ ...s, kind: v, ...defaults(v) })); }}>
      <option value="DELIVERY">Delivery</option><option value="INTERNAL">Internal Transfer</option></select>) : <ReadVal>{TYPE_LABEL[kind]}</ReadVal>}</Field>;
  const shortText = (l) => { const p = prod(db, Number(l.productId)); const fr = Math.max(freeAt(db, p.id, Number(f.sourceLocId), op?.id), 0); return { p, fr, gap: Number(l.quantity) - fr }; };

  return (
    <div>
      <div className="t3" style={{ fontSize: 13, marginBottom: 4 }}><button className="lnk2" onClick={backList}>{listName}</button> / <span className="mono">{op ? op.reference : "New"}</span></div>
      <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
        <button className="btn bs" onClick={() => go("opForm", { type: kind, n: Date.now() })}><Plus size={16} />New</button>
        <h1 className="h-title" style={{ margin: 0 }}>{TYPE_LABEL[kind]}</h1>
      </div>
      <div className="flex items-center justify-between gap-3 flex-wrap" style={{ padding: "12px 0", borderTop: "1px solid var(--b)", borderBottom: "1px solid var(--b)", marginBottom: 20 }}>
        <div className="flex items-center gap-2 flex-wrap">
          {(status === "NEW" || status === "DRAFT") && <button className="btn bp" onClick={todo}>To Do</button>}
          {status === "READY" && <button className="btn bp" onClick={validate} disabled={!pickOk} title={pickOk ? "Validate" : "Tick Picked and Packed first"}>Validate</button>}
          {status === "WAITING" && <button className="btn bs" onClick={recheck}><Hourglass size={15} />Check Availability</button>}
          <button className="btn bs" disabled={status !== "DONE"} title={status !== "DONE" ? "Available once Done" : "Print"} onClick={() => go("print", { id: op.id })}><Printer size={16} />Print</button>
          {(PENDING.includes(status) || status === "NEW") && <button className="btn bd" onClick={cancel}>{status === "NEW" ? "Discard" : "Cancel"}</button>}
          {(status === "NEW" || status === "DRAFT") && <button className="btn bg" onClick={save}>Save draft</button>}
        </div>
        <StatusBar kind={kind} status={status === "NEW" ? "DRAFT" : status} />
      </div>
      <div className="card" style={{ padding: 24 }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="mono" style={{ fontSize: 24, lineHeight: "32px", fontWeight: 600, textDecoration: status === "CANCELED" ? "line-through" : "none" }}>{op ? op.reference : <span className="t3">New</span>}</div>
          {op && isLate(op) && <LateTag />}
          {status === "DONE" && <Pill c={COL.green}>Done · {fmtDT(op.doneDate)}</Pill>}
        </div>
        {status === "WAITING" && <div className="banner warn" style={{ marginTop: 16 }}><Hourglass size={16} style={{ color: COL.amber, flexShrink: 0 }} />
          <span>Waiting for stock: {shortNow.map((l) => { const s = shortText(l); return `${s.p.name} (short ${fmtQty(s.gap)})`; }).join(", ") || "re-check availability"}. It becomes Ready automatically when stock arrives.</span></div>}
        {editable && shortNow.length > 0 && <div className="banner warn" style={{ marginTop: 16 }}><AlertTriangle size={16} style={{ color: COL.amber, flexShrink: 0 }} />
          <span>{shortNow.map((l) => { const s = shortText(l); return `${s.p.name}: only ${fmtQty(s.fr)} available`; }).join(" · ")} at {loc(db, Number(f.sourceLocId)).fullName}. This will wait for stock when you click To Do.</span></div>}
        <div className="grid gap-x-8 gap-y-4 md:grid-cols-2" style={{ marginTop: 20 }}>
          {kind === "RECEIPT" && <>{txt("contact", "Receive From", true, "Vendor name")}{dateField}<Field label="Responsible">{responsible}</Field><Field label="Destination">{locSel("destLocId")}</Field></>}
          {kind === "DELIVERY" && <>{txt("deliveryAddress", "Delivery Address", true, "Street, city")}{dateField}{txt("contact", "Contact", false, "Customer name")}{opType}<Field label="Responsible">{responsible}</Field><Field label="Source Location">{locSel("sourceLocId")}</Field></>}
          {kind === "INTERNAL" && <><Field label="Source Location">{locSel("sourceLocId")}</Field>{dateField}<Field label="Destination Location">{locSel("destLocId")}</Field>{opType}<Field label="Responsible">{responsible}</Field>{txt("contact", "Reference note", false, "Optional")}</>}
        </div>
        <div style={{ marginTop: 28 }}>
          <div className="flex items-center justify-between flex-wrap gap-2" style={{ marginBottom: 8 }}>
            <div className="upper">Products</div>
            {status === "READY" && kind === "DELIVERY" && (
              <div className="flex items-center gap-4" style={{ fontSize: 13 }}>
                <label className="flex items-center gap-2" style={{ cursor: "pointer" }}><input type="checkbox" className="cb" checked={pick.picked} onChange={(e) => setPick({ ...pick, picked: e.target.checked })} />Picked</label>
                <label className="flex items-center gap-2" style={{ cursor: "pointer" }}><input type="checkbox" className="cb" checked={pick.packed} onChange={(e) => setPick({ ...pick, packed: e.target.checked })} />Packed</label>
                {!pickOk && <span className="t3" style={{ fontSize: 12 }}>Tick both to enable Validate</span>}
              </div>)}
          </div>
          <LineEditor ctx={ctx} f={f} setF={setF} editable={editable} outgoing={outgoing} op={op} />
          <div className="t2" style={{ textAlign: "right", fontSize: 13, marginTop: 10 }}>Total: <span className="mono">{f.lines.length}</span> product{f.lines.length !== 1 ? "s" : ""} · <span className="mono">{fmtQty(units)}</span> units</div>
        </div>
      </div>
    </div>
  );
}

function LineEditor({ ctx, f, setF, editable, outgoing, op }) {
  const { db, toast } = ctx; const warned = useRef(new Set());
  const showFree = outgoing && op?.status !== "DONE" && op?.status !== "CANCELED";
  const freeOf = (pid) => freeAt(db, Number(pid), Number(f.sourceLocId), op?.id);
  const upd = (k, patch) => setF((s) => ({ ...s, lines: s.lines.map((l) => (l.k === k ? { ...l, ...patch } : l)) }));
  const add = () => setF((s) => ({ ...s, lines: [...s.lines, { k: Date.now(), productId: "", quantity: "1" }] }));
  const del = (k) => setF((s) => ({ ...s, lines: s.lines.filter((l) => l.k !== k) }));
  useEffect(() => { // mockup: "alert the notification & mark the line red if product is not in stock"
    if (!editable || !showFree) return;
    f.lines.forEach((l) => {
      if (!l.productId) return; const fr = freeOf(l.productId); const key = `${l.productId}:${f.sourceLocId}`;
      if (Number(l.quantity) > fr && !warned.current.has(key)) {
        warned.current.add(key);
        toast(`${prod(db, Number(l.productId)).name}: only ${fmtQty(Math.max(fr, 0))} available at ${loc(db, Number(f.sourceLocId)).fullName}`, "error");
      }
    });
  }); // eslint-disable-line
  return (<>
    <div style={{ border: "1px solid var(--b)", borderRadius: 10, overflow: "hidden" }}>
      <table className="tbl">
        <thead><tr><th>Product</th>{showFree && <th className="r">Free</th>}<th className="r" style={{ width: 170 }}>Quantity</th>{editable && <th style={{ width: 52 }} />}</tr></thead>
        <tbody>
          {f.lines.map((l) => {
            const p = prod(db, Number(l.productId)); const fr = showFree && l.productId ? freeOf(l.productId) : null;
            const short = fr !== null && Number(l.quantity) > fr;
            const used = new Set(f.lines.filter((x) => x.k !== l.k).map((x) => Number(x.productId)));
            const tag = short && <span className="late"><AlertTriangle size={11} />Short by {fmtQty(Number(l.quantity) - Math.max(fr, 0))}</span>;
            return (
              <tr key={l.k} style={short ? { background: "rgba(255,92,92,.06)" } : undefined}>
                <td style={short ? { boxShadow: "inset 3px 0 0 var(--red)" } : undefined}>
                  {editable ? (
                    <div className="flex items-center gap-2">
                      <select className="inp" style={{ maxWidth: 340 }} value={l.productId} aria-label="Product" onChange={(e) => upd(l.k, { productId: e.target.value })}>
                        <option value="">Select product…</option>
                        {db.products.map((x) => <option key={x.id} value={x.id} disabled={used.has(x.id)}>[{x.sku}] {x.name}</option>)}
                      </select>{tag}</div>
                  ) : <div className="flex items-center gap-2"><PName p={p} />{tag}</div>}
                </td>
                {showFree && <td className="r mono" style={{ color: short ? "var(--red)" : "var(--t2)" }}>{fr === null ? "—" : fmtQty(Math.max(fr, 0))}</td>}
                <td className="r">
                  {editable ? <input className="inp mono" aria-label="Quantity" style={{ width: 130, textAlign: "right", marginLeft: "auto", display: "block", color: short ? "var(--red)" : undefined }}
                    type="number" min="0" step="any" value={l.quantity} onChange={(e) => upd(l.k, { quantity: e.target.value })}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
                    : <span className="mono" style={{ color: short ? "var(--red)" : undefined }}>{fmtQty(l.quantity)} <span className="t3">{p?.uom}</span></span>}
                </td>
                {editable && <td><button className="ibtn" aria-label="Remove line" onClick={() => del(l.k)}><Trash2 size={15} /></button></td>}
              </tr>);
          })}
          {!f.lines.length && <tr><td colSpan={4} className="t3" style={{ textAlign: "center" }}>No products yet</td></tr>}
        </tbody>
      </table>
    </div>
    {editable && <button className="lnk" style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6 }} onClick={add}><Plus size={14} />New Product</button>}
  </>);
}

/* ---------- Print view (white A4 document) ---------- */
function PrintView({ ctx, id }) {
  const { db, go } = ctx; const op = db.operations.find((o) => o.id === id);
  const title = { RECEIPT: "GOODS RECEIPT NOTE", DELIVERY: "DELIVERY NOTE", INTERNAL: "INTERNAL TRANSFER", ADJUSTMENT: "STOCK ADJUSTMENT" };
  const back = () => (op ? go("opForm", { id: op.id }) : go("dashboard"));
  const units = op ? op.lines.reduce((a, l) => a + l.quantity, 0) : 0;
  const wh = op && db.warehouses.find((w) => w.id === op.warehouseId);
  return (
    <div style={{ minHeight: "100vh", padding: "24px 16px" }}>
      <div className="no-print flex items-center justify-between" style={{ maxWidth: 794, margin: "0 auto 16px" }}>
        <button className="btn bs" onClick={back}>← Back</button>
        {op?.status === "DONE" && <button className="btn bp" onClick={() => { try { window.print(); } catch (e) { /* noop */ } }}><Printer size={16} />Print</button>}
      </div>
      {!op || op.status !== "DONE" ? (
        <div className="card" style={{ maxWidth: 520, margin: "40px auto" }}><Empty icon={Printer} title="Printing is available after validation." sub="Validate the operation first, then print." /></div>
      ) : (
        <div className="doc" style={{ maxWidth: 794, margin: "0 auto", padding: 48, borderRadius: 4, boxShadow: "0 8px 32px rgba(0,0,0,.4)" }}>
          <div className="flex justify-between items-start">
            <div><div className="flex items-center gap-2" style={{ fontWeight: 600, fontSize: 18 }}><Diamond s={12} />StockSense</div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{wh?.name}<br />{wh?.address}</div></div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 12, letterSpacing: ".1em", color: "#555" }}>{title[op.type]}</div>
              <div className="mono" style={{ fontSize: 24, fontWeight: 600, marginTop: 4 }}>{op.reference}</div>
              <div style={{ display: "inline-block", marginTop: 6, border: "2px solid #1a9c57", color: "#1a9c57", padding: "2px 10px", borderRadius: 4, fontWeight: 700, fontSize: 12, letterSpacing: ".1em" }}>DONE</div></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 32px", margin: "28px 0", fontSize: 13 }}>
            {[["Contact", op.contact || "—"], [op.type === "DELIVERY" ? "Delivery Address" : "From", op.type === "DELIVERY" ? op.deliveryAddress : loc(db, op.sourceLocId).fullName],
              ["Schedule Date", fmtDate(op.scheduledDate)], ["To", loc(db, op.destLocId).fullName], ["Done Date", fmtDT(op.doneDate)], ["Responsible", userName(db, op.responsibleId)]]
              .map(([k, v]) => <div key={k}><div style={{ fontSize: 11, color: "#777", textTransform: "uppercase", letterSpacing: ".06em" }}>{k}</div><div>{v}</div></div>)}
          </div>
          <table><thead><tr><th>#</th><th>SKU</th><th>Product</th><th>UoM</th><th style={{ textAlign: "right" }}>Quantity</th></tr></thead>
            <tbody>{op.lines.map((l, i) => { const p = prod(db, l.productId); return (
              <tr key={i}><td>{i + 1}</td><td className="mono">{p?.sku}</td><td>{p?.name}</td><td>{p?.uom}</td><td className="mono" style={{ textAlign: "right" }}>{fmtQty(l.quantity)}</td></tr>); })}</tbody></table>
          <div style={{ textAlign: "right", fontSize: 13, marginTop: 12 }}>Total: {op.lines.length} products · {fmtQty(units)} units</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, marginTop: 64, fontSize: 12, color: "#555" }}>
            <div style={{ borderTop: "1px solid #999", paddingTop: 6 }}>Delivered by</div>
            <div style={{ borderTop: "1px solid #999", paddingTop: 6 }}>Received by</div>
          </div>
          <div style={{ fontSize: 11, color: "#999", marginTop: 40, textAlign: "center" }}>Generated by StockSense · {fmtDT(Date.now())} · Page 1 of 1</div>
        </div>)}
    </div>
  );
}

/* =====================================================================
   9. ADJUSTMENTS
   ===================================================================== */
function Adjustments({ ctx }) {
  const { db } = ctx; const [open, setOpen] = useState(false); const [q, setQ] = useState("");
  const rows = db.operations.filter((o) => o.type === "ADJUSTMENT").map((o) => {
    const plus = loc(db, o.destLocId).type === "INTERNAL"; const l = o.lines[0];
    return { o, p: prod(db, l.productId), at: plus ? o.destLocId : o.sourceLocId, d: plus ? l.quantity : -l.quantity };
  }).filter((r) => !q || `${r.o.reference} ${r.p?.name} ${r.p?.sku}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => dateOf(b.o) - dateOf(a.o));
  return (<>
    <PageHeader title="Adjustments" sub="Correct the system when the physical count disagrees"
      right={<><SearchBox value={q} onChange={setQ} placeholder="Search reference or product" /><button className="btn bp" onClick={() => setOpen(true)}><Plus size={16} />New Adjustment</button></>} />
    <div className="card">
      {rows.length ? (
        <table className="tbl"><thead><tr><th>Reference</th><th>Date</th><th>Product</th><th>Location</th><th className="r">Δ Qty</th><th>Reason</th><th>By</th></tr></thead>
          <tbody>{rows.map(({ o, p, at, d }) => (
            <tr key={o.id}>
              <td className="mono" style={{ fontWeight: 600, boxShadow: `inset 3px 0 0 ${d > 0 ? COL.green : COL.red}` }}>{o.reference}</td>
              <td className="mono">{fmtDT(dateOf(o))}</td><td><PName p={p} /></td><td className="mono t2">{loc(db, at).fullName}</td>
              <td className="r mono" style={{ color: d > 0 ? COL.green : COL.red, fontWeight: 600 }}>{d > 0 ? "+" : "−"}{fmtQty(Math.abs(d))} <span className="t3">{p?.uom}</span></td>
              <td className="t2">{o.note}</td><td className="t2">{userName(db, o.responsibleId)}</td>
            </tr>))}</tbody></table>
      ) : <Empty icon={SlidersHorizontal} title="No adjustments yet" sub="Adjustments fix mismatches between recorded and counted stock."
        action={<button className="btn bp" onClick={() => setOpen(true)}><Plus size={16} />New Adjustment</button>} />}
    </div>
    {open && <AdjustDrawer ctx={ctx} onClose={() => setOpen(false)} />}
  </>);
}
function AdjustDrawer({ ctx, onClose }) {
  const { db, run, toast, user } = ctx; const internals = internalLocs(db);
  const [f, setF] = useState({ productId: "", locationId: internals[0].id, counted: "", reason: "Damaged" });
  const p = prod(db, Number(f.productId));
  const rec = p ? qtyAt(db, p.id, Number(f.locationId)) : null;
  const diff = f.counted === "" || rec === null ? null : Number(f.counted) - rec;
  const valid = p && diff !== null && diff !== 0 && !isNaN(diff);
  const apply = () => {
    const r = run((d) => adjust(d, { productId: Number(f.productId), locationId: Number(f.locationId), counted: f.counted, reason: f.reason }, user.id));
    if (r.ok) { toast(`${p.name} adjusted ${diff > 0 ? "+" : "−"}${fmtQty(Math.abs(diff))} ${p.uom} · ${r.res.op.reference}`); onClose(); }
  };
  return (
    <Drawer title="New Adjustment" onClose={onClose} footer={<><button className="btn bs" onClick={onClose}>Cancel</button><button className="btn bp" disabled={!valid} onClick={apply}>Apply Adjustment</button></>}>
      <div className="flex flex-col gap-4">
        <Field label="Product" req><select className="inp" autoFocus value={f.productId} onChange={(e) => setF({ ...f, productId: e.target.value, counted: "" })}>
          <option value="">Select product…</option>{db.products.map((x) => <option key={x.id} value={x.id}>[{x.sku}] {x.name}</option>)}</select></Field>
        <Field label="Location" req><select className="inp mono" value={f.locationId} onChange={(e) => setF({ ...f, locationId: Number(e.target.value), counted: "" })}>
          {internals.map((l) => <option key={l.id} value={l.id}>{l.fullName}</option>)}</select></Field>
        <div className="flex justify-between" style={{ padding: "10px 12px", background: "var(--s2)", borderRadius: 8 }}><span className="t2">Recorded quantity</span>
          <span className="mono">{rec === null ? "—" : `${fmtQty(rec)} ${p.uom}`}</span></div>
        <Field label="Counted quantity" req><input className="inp mono" type="number" min="0" step="any" disabled={!p} value={f.counted} onChange={(e) => setF({ ...f, counted: e.target.value })} /></Field>
        <div><div className="lbl">Difference</div>
          <div className="mono" style={{ fontSize: 28, lineHeight: "36px", fontWeight: 600, color: !valid ? "var(--t3)" : diff > 0 ? COL.green : COL.red }}>
            {diff === null || isNaN(diff) ? "—" : diff === 0 ? "No change" : `${diff > 0 ? "+" : "−"}${fmtQty(Math.abs(diff))} ${p.uom}`}</div></div>
        <Field label="Reason"><select className="inp" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })}>
          {["Damaged", "Lost", "Found", "Count correction"].map((r) => <option key={r}>{r}</option>)}</select></Field>
        {valid && <div className="banner info"><Info size={16} style={{ flexShrink: 0 }} /><span>{p.name} @ <span className="mono">{loc(db, Number(f.locationId)).fullName}</span>&nbsp;&nbsp;<span className="mono">{fmtQty(rec)} → {fmtQty(Number(f.counted))}</span></span></div>}
      </div>
    </Drawer>
  );
}

/* =====================================================================
   10. STOCK (products, inline update, drawer, product modal)
   ===================================================================== */
function Stock({ ctx, preset }) {
  const { db, user } = ctx;
  const [q, setQ] = useState(""); const [cat, setCat] = useState(""); const [wh, setWh] = useState(""); const [low, setLow] = useState(preset === "low");
  const [pop, setPop] = useState(null); const [drawer, setDrawer] = useState(null); const [pm, setPm] = useState(null);
  const W = wh ? Number(wh) : null;
  const all = db.products.filter((p) => (!cat || p.categoryId === Number(cat)) && (!q || `${p.sku} ${p.name}`.toLowerCase().includes(q.toLowerCase())))
    .map((p) => ({ p, oh: onHand(db, p.id, W), fr: freeTotal(db, p.id, W) }));
  const rows = all.filter((r) => !low || r.oh <= 0 || r.fr <= r.p.reorderMin);
  const units = rows.reduce((a, r) => a + r.oh, 0), value = rows.reduce((a, r) => a + r.oh * r.p.unitCost, 0);
  const reservations = (pid) => db.operations.filter((o) => o.status === "READY" && isOut(o) && (!W || o.warehouseId === W))
    .flatMap((o) => o.lines.filter((l) => l.productId === pid).map((l) => `${fmtQty(l.quantity)} reserved for ${o.reference}`));
  return (<>
    <div className="flex items-center justify-between gap-4 flex-wrap" style={{ marginBottom: 16 }}>
      <div className="flex items-center gap-3"><button className="btn bs" onClick={() => setPm({})}><Plus size={16} />New Product</button><h1 className="h-title" style={{ margin: 0 }}>Stock</h1></div>
      <div className="flex items-center gap-2 flex-wrap">
        <SearchBox value={q} onChange={setQ} placeholder="Search SKU or name" w={240} />
        <ChipSelect label="Category" value={cat} onChange={setCat} options={[["", "Category: All"], ...db.categories.map((c) => [String(c.id), c.name])]} />
        <ChipSelect label="Warehouse" value={wh} onChange={setWh} options={[["", "Warehouse: All"], ...db.warehouses.map((w) => [String(w.id), w.shortCode])]} />
        <label className="flex items-center gap-2 t2" style={{ fontSize: 13, cursor: "pointer", marginLeft: 4 }}><input type="checkbox" className="cb" checked={low} onChange={(e) => setLow(e.target.checked)} />Low stock only</label>
      </div>
    </div>
    <div className="card">
      {rows.length ? (
        <table className="tbl"><thead><tr><th>Product</th><th>Category</th><th>UoM</th><th className="r">Per Unit Cost</th><th className="r">On Hand</th><th className="r">Free to Use</th><th>Status</th></tr></thead>
          <tbody>{rows.map(({ p, oh, fr }) => { const [sl, sc] = stockStatus(oh, fr, p.reorderMin); const res = reservations(p.id); return (
            <tr key={p.id} className="rc" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && e.target === e.currentTarget && setDrawer(p.id)} onClick={() => setDrawer(p.id)}>
              <td><PName p={p} /></td><td className="t2">{db.categories.find((c) => c.id === p.categoryId)?.name || "—"}</td><td className="t2">{p.uom}</td>
              <td className="r mono">{inr(p.unitCost)}</td>
              <td className="r" style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
                <button className="lnk2 mono" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--t)" }} onClick={() => setPop(p.id)} aria-label={`Update stock for ${p.name}`} title="Update stock">
                  <Pencil size={13} className="t3" />{fmtQty(oh)}</button>
                {pop === p.id && <StockPopover ctx={ctx} p={p} whId={W} onClose={() => setPop(null)} />}
              </td>
              <td className="r mono" title={res.length ? res.join("\n") : "Nothing reserved"} style={{ color: fr < oh ? COL.t2 : undefined, textDecoration: fr < oh ? "underline dotted" : "none" }}>{fmtQty(Math.max(fr, 0))}</td>
              <td><Pill c={sc}>{sl}</Pill></td>
            </tr>); })}</tbody></table>
      ) : all.length ? <Empty icon={Search} title="No matching products" sub="Try a different search or filter." />
        : <Empty title="No products yet" sub="Add your first product to start tracking stock." action={<button className="btn bp" onClick={() => setPm({})}><Plus size={16} />New Product</button>} />}
    </div>
    <div className="t2" style={{ fontSize: 13, marginTop: 12 }}><span className="mono">{rows.length}</span> products · <span className="mono">{fmtQty(units)}</span> units on hand · <span className="mono">{inr0(value)}</span> stock value</div>
    {drawer && <ProductDrawer ctx={ctx} pid={drawer} onClose={() => setDrawer(null)} onEdit={(p) => { setDrawer(null); setPm(p); }} canDelete={user.role === "MANAGER"} />}
    {pm && <ProductModal ctx={ctx} product={pm.id ? pm : null} onClose={() => setPm(null)} />}
  </>);
}
function StockPopover({ ctx, p, whId, onClose }) {
  const { db, run, toast, user } = ctx; const ref = useRef(null); useOutside(ref, onClose); useEsc(onClose);
  const locs = internalLocs(db, whId);
  const [lid, setLid] = useState(() => (locs.slice().sort((a, b) => qtyAt(db, p.id, b.id) - qtyAt(db, p.id, a.id))[0] || locs[0]).id);
  const cur = qtyAt(db, p.id, lid);
  const [c, setC] = useState(String(cur));
  const diff = c === "" ? 0 : Number(c) - cur;
  const ok = c !== "" && diff !== 0 && !isNaN(diff);
  const save = () => { if (!ok) return; const r = run((d) => adjust(d, { productId: p.id, locationId: lid, counted: c, reason: "Count correction" }, user.id));
    if (r.ok) { toast(`${p.name} ${fmtQty(cur)} → ${fmtQty(Number(c))} · Logged as ${r.res.op.reference}`); onClose(); } };
  return (
    <div ref={ref} className="menu" style={{ right: 0, top: "calc(100% - 4px)", width: 300, padding: 16, textAlign: "left", cursor: "default" }} onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}><span style={{ fontWeight: 600 }}>Update stock</span><span className="mono t2" style={{ fontSize: 12 }}>{p.sku}</span></div>
      <div className="flex flex-col gap-3">
        <Field label="Location"><select className="inp mono" value={lid} onChange={(e) => { const v = Number(e.target.value); setLid(v); setC(String(qtyAt(db, p.id, v))); }}>
          {locs.map((l) => <option key={l.id} value={l.id}>{l.fullName}</option>)}</select></Field>
        <Field label="Counted quantity"><input className="inp mono" type="number" min="0" step="any" autoFocus value={c} onChange={(e) => setC(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()} /></Field>
        <div className="flex justify-between" style={{ fontSize: 13 }}><span className="t2">Adjustment</span>
          <span className="mono">{fmtQty(cur)} → {c === "" ? "—" : fmtQty(Number(c))} {ok && <span style={{ color: diff > 0 ? COL.green : COL.red }}>({diff > 0 ? "+" : "−"}{fmtQty(Math.abs(diff))})</span>}</span></div>
        <div className="t3" style={{ fontSize: 12 }}>Will be logged as an adjustment</div>
        <div className="flex justify-end gap-2"><button className="btn bs bsm" onClick={onClose}>Cancel</button><button className="btn bp bsm" disabled={!ok} onClick={save}>Update</button></div>
      </div>
    </div>
  );
}
function ProductDrawer({ ctx, pid, onClose, onEdit, canDelete }) {
  const { db, run, toast, go } = ctx; const p = prod(db, pid);
  const [rule, setRule] = useState({ min: String(p?.reorderMin ?? 0), max: String(p?.reorderMax ?? 0) });
  if (!p) return null;
  const byLoc = internalLocs(db).map((l) => ({ l, oh: qtyAt(db, p.id, l.id), fr: freeAt(db, p.id, l.id) })).filter((x) => x.oh !== 0 || x.fr !== 0);
  const moves = db.moves.filter((m) => m.productId === p.id).slice(0, 5);
  const hasHistory = db.operations.some((o) => o.lines.some((l) => l.productId === p.id));
  const saveRule = () => { const r = run((d) => { const mn = Number(rule.min), mx = Number(rule.max); if (mn < 0 || mx < 0 || isNaN(mn) || isNaN(mx)) fail("Enter valid numbers"); if (mx && mx < mn) fail("Max must be at least min");
    const x = prod(d, p.id); x.reorderMin = mn; x.reorderMax = mx; }); if (r.ok) toast("Reordering rule saved"); };
  const del = () => { const r = run((d) => { d.products = d.products.filter((x) => x.id !== p.id); }); if (r.ok) { toast(`${p.name} deleted`, "info"); onClose(); } };
  return (
    <Drawer title={<span><span className="mono t2">[{p.sku}]</span> {p.name}</span>} onClose={onClose}
      footer={<><button className="btn bd" disabled={!canDelete || hasHistory} title={!canDelete ? "Only managers can do this" : hasHistory ? "Products with stock history can't be deleted" : "Delete"} onClick={del}><Trash2 size={15} />Delete</button>
        <button className="btn bs" onClick={() => onEdit(p)}><Pencil size={15} />Edit</button></>}>
      <div className="flex items-center gap-3 flex-wrap">
        <Pill c={COL.gray}>{db.categories.find((c) => c.id === p.categoryId)?.name || "Uncategorized"}</Pill>
        <span className="t2">Unit cost <span className="mono" style={{ color: "var(--t)" }}>{inr(p.unitCost)}</span> / {p.uom}</span></div>
      <div className="upper" style={{ marginTop: 24, marginBottom: 8 }}>Stock by location</div>
      <div style={{ border: "1px solid var(--b2)", borderRadius: 10, overflow: "hidden" }}>
        <table className="tbl"><thead><tr><th>Location</th><th className="r">On hand</th><th className="r">Free</th></tr></thead>
          <tbody>{byLoc.length ? byLoc.map(({ l, oh, fr }) => <tr key={l.id}><td className="mono">{l.fullName}</td><td className="r mono">{fmtQty(oh)}</td><td className="r mono t2">{fmtQty(Math.max(fr, 0))}</td></tr>)
            : <tr><td colSpan={3} className="t3" style={{ textAlign: "center" }}>No stock anywhere</td></tr>}</tbody></table></div>
      <div className="upper" style={{ marginTop: 24, marginBottom: 8 }}>Reordering rule</div>
      <div className="flex items-end gap-2">
        <Field label="Min"><input className="inp mono" style={{ width: 100 }} type="number" min="0" value={rule.min} onChange={(e) => setRule({ ...rule, min: e.target.value })} /></Field>
        <Field label="Max"><input className="inp mono" style={{ width: 100 }} type="number" min="0" value={rule.max} onChange={(e) => setRule({ ...rule, max: e.target.value })} /></Field>
        <button className="btn bs" onClick={saveRule}>Save</button></div>
      <div className="flex items-center justify-between" style={{ marginTop: 24, marginBottom: 8 }}><span className="upper">Recent moves</span>
        <button className="lnk" style={{ fontSize: 13 }} onClick={() => go("moves", { product: p.id })}>View all →</button></div>
      {moves.length ? moves.map((m) => { const o = db.operations.find((x) => x.id === m.operationId); const d = o ? dirOf(db, o) : "INT"; return (
        <div key={m.id} className="flex items-center justify-between" style={{ padding: "8px 0", borderBottom: "1px solid var(--b2)", fontSize: 13 }}>
          <div><div className="mono">{m.reference}</div><div className="t3" style={{ fontSize: 12 }}>{fmtDT(m.createdAt)}</div></div>
          <span className="mono" style={{ color: DIR_COLOR[d], fontWeight: 600 }}>{signed(d, m.quantity)}</span></div>); })
        : <div className="t3" style={{ fontSize: 13 }}>No movements yet</div>}
    </Drawer>
  );
}
function ProductModal({ ctx, product, onClose }) {
  const { db, run, toast, user } = ctx; const internals = internalLocs(db);
  const [f, setF] = useState(() => product
    ? { id: product.id, name: product.name, sku: product.sku, category: db.categories.find((c) => c.id === product.categoryId)?.name || "", uom: product.uom, unitCost: String(product.unitCost), reorderMin: String(product.reorderMin), reorderMax: String(product.reorderMax) }
    : { name: "", sku: "", category: "", uom: "Units", unitCost: "", initial: "", locationId: internals[0].id, reorderMin: "", reorderMax: "" });
  const [newCat, setNewCat] = useState(false);
  const skuTaken = f.sku && db.products.some((p) => p.sku === f.sku.trim().toUpperCase() && p.id !== f.id);
  const save = () => { const r = run((d) => saveProduct(d, f, user.id));
    if (r.ok) { toast(product ? `${f.name} updated` : `${f.name} created${r.res.ref ? ` · opening stock via ${r.res.ref}` : ""}`); onClose(); } };
  const s = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title={product ? "Edit Product" : "New Product"} onClose={onClose} footer={<><button className="btn bs" onClick={onClose}>Cancel</button><button className="btn bp" disabled={!f.name.trim() || !f.sku.trim() || skuTaken} onClick={save}>Save</button></>}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" req><input className="inp" autoFocus value={f.name} onChange={s("name")} placeholder="e.g. Office Desk" /></Field>
        <Field label="SKU" req error={skuTaken ? "This SKU already exists" : ""} hint="Shown as [SKU] Name everywhere"><input className={"inp mono " + (skuTaken ? "err" : "")} value={f.sku} onChange={(e) => setF({ ...f, sku: e.target.value.toUpperCase() })} placeholder="DESK001" /></Field>
        <Field label="Category">
          {newCat ? (
            <div className="flex gap-2"><input className="inp" autoFocus value={f.category} onChange={s("category")} placeholder="New category name" />
              <button className="ibtn" aria-label="Pick existing category" onClick={() => { setNewCat(false); setF({ ...f, category: "" }); }}><X size={16} /></button></div>
          ) : (
            <select className="inp" value={f.category} onChange={(e) => { if (e.target.value === "__new") { setNewCat(true); setF({ ...f, category: "" }); } else setF({ ...f, category: e.target.value }); }}>
              <option value="">— None —</option>{db.categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}<option value="__new">+ New category…</option></select>)}
        </Field>
        <Field label="Unit of Measure"><select className="inp" value={f.uom} onChange={s("uom")}>{UOMS.map((u) => <option key={u}>{u}</option>)}</select></Field>
        <Field label="Per unit cost (₹)"><input className="inp mono" type="number" min="0" step="any" value={f.unitCost} onChange={s("unitCost")} placeholder="0.00" /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Reorder min"><input className="inp mono" type="number" min="0" value={f.reorderMin} onChange={s("reorderMin")} placeholder="0" /></Field>
          <Field label="Reorder max"><input className="inp mono" type="number" min="0" value={f.reorderMax} onChange={s("reorderMax")} placeholder="0" /></Field></div>
        {!product && <>
          <Field label="Initial stock (optional)" hint="Recorded as a receipt in the ledger"><input className="inp mono" type="number" min="0" step="any" value={f.initial} onChange={s("initial")} placeholder="0" /></Field>
          <Field label="Initial location"><select className="inp mono" value={f.locationId} onChange={s("locationId")}>{internals.map((l) => <option key={l.id} value={l.id}>{l.fullName}</option>)}</select></Field>
        </>}
      </div>
    </Modal>
  );
}

/* =====================================================================
   11. MOVE HISTORY (one row per product line; IN green / OUT red)
   ===================================================================== */
function MoveHistory({ ctx, product }) {
  const { db, go } = ctx;
  const [q, setQ] = useState(""); const [type, setType] = useState(""); const [st, setSt] = useState(""); const [dir, setDir] = useState("");
  const [view, setView] = useState("list"); const [pf, setPf] = useState(product || "");
  const rows = db.operations.filter((o) => (!type || o.type === type) && (!st || o.status === st) && (!q || matchQ(o, q)) && (!dir || dirOf(db, o) === dir))
    .sort((a, b) => dateOf(b) - dateOf(a))
    .flatMap((o) => o.lines.filter((l) => !pf || l.productId === Number(pf)).map((l, i) => ({ o, l, first: i === 0, d: dirOf(db, o), key: `${o.id}-${l.productId}` })));
  const exportCsv = () => {
    const head = ["Reference", "Date", "Contact", "From", "To", "Product", "Quantity", "Direction", "Status"];
    const lines = [head, ...rows.map((r) => { const p = prod(db, r.l.productId); return [r.o.reference, fmtDate(dateOf(r.o)), r.o.contact, loc(db, r.o.sourceLocId).fullName, loc(db, r.o.destLocId).fullName, `[${p?.sku}] ${p?.name}`, r.l.quantity, r.d, STATUS[r.o.status].label]; })];
    const csv = lines.map((a) => a.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    try { const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); const a = document.createElement("a"); a.href = url; a.download = "move-history.csv"; a.click(); URL.revokeObjectURL(url); ctx.toast(`Exported ${rows.length} rows`); }
    catch (e) { ctx.toast("Export isn't available in this preview", "error"); }
  };
  const Qty = ({ r }) => { const p = prod(db, r.l.productId); return <span className="mono" style={{ color: DIR_COLOR[r.d], fontWeight: 600 }}>{signed(r.d, r.l.quantity)} <span style={{ fontWeight: 400 }} className="t2">{p?.name}</span></span>; };
  return (<>
    <div className="flex items-center justify-between gap-4 flex-wrap" style={{ marginBottom: 16 }}>
      <div className="flex items-center gap-3">
        <Dropdown trigger={(o, t) => <button className="btn bs" onClick={t} aria-expanded={o}><Plus size={16} />New<ChevronDown size={14} /></button>}>
          <button className="mi" onClick={() => go("opForm", { type: "RECEIPT" })}><ArrowDownToLine size={16} className="t2" />New Receipt</button>
          <button className="mi" onClick={() => go("opForm", { type: "DELIVERY" })}><ArrowUpFromLine size={16} className="t2" />New Delivery</button>
          <button className="mi" onClick={() => go("adjustments")}><SlidersHorizontal size={16} className="t2" />New Adjustment</button>
        </Dropdown>
        <h1 className="h-title" style={{ margin: 0 }}>Move History</h1></div>
      <div className="flex items-center gap-2"><SearchBox value={q} onChange={setQ} placeholder="Search reference or contact" /><ViewToggle v={view} set={setView} /></div>
    </div>
    <div className="flex items-center justify-between gap-3 flex-wrap" style={{ marginBottom: 16 }}>
      <div className="flex items-center gap-2 flex-wrap">
        <ChipSelect label="Type" value={type} onChange={setType} options={[["", "Type: All"], ["RECEIPT", "Receipts"], ["DELIVERY", "Deliveries"], ["INTERNAL", "Internal"], ["ADJUSTMENT", "Adjustments"]]} />
        <ChipSelect label="Status" value={st} onChange={setSt} options={[["", "Status: All"], ...Object.keys(STATUS).map((s) => [s, STATUS[s].label])]} />
        <ChipSelect label="Direction" value={dir} onChange={setDir} options={[["", "Direction: All"], ["IN", "In"], ["OUT", "Out"], ["INT", "Internal"]]} />
        {pf && <span className="badge" style={{ background: "var(--acs)", color: "var(--ac)", height: 32, borderRadius: 8, padding: "0 10px" }}>Product: {prod(db, Number(pf))?.name}
          <button className="lnk" aria-label="Clear product filter" onClick={() => setPf("")}><X size={13} /></button></span>}
        <span className="flex items-center gap-3 t2" style={{ fontSize: 12, marginLeft: 8 }}>
          {[["In", COL.green], ["Out", COL.red], ["Internal", COL.t2]].map(([l, c]) => <span key={l} className="flex items-center gap-1"><i style={{ width: 8, height: 8, borderRadius: 9, background: c, display: "inline-block" }} />{l}</span>)}</span>
      </div>
      <button className="btn bg bsm" onClick={exportCsv}><Download size={14} />Export CSV</button>
    </div>
    {view === "list" ? (
      <div className="card">
        {rows.length ? (
          <table className="tbl"><thead><tr><th>Reference</th><th>Date</th><th>Contact</th><th>From</th><th>To</th><th>Quantity</th><th>Status</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.key} className="rc" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && openOp(go, r.o)} onClick={() => openOp(go, r.o)}>
                <td className="mono" style={{ fontWeight: 600, boxShadow: `inset 3px 0 0 ${DIR_COLOR[r.d]}`, color: r.first ? undefined : "var(--t3)" }}>{r.first ? r.o.reference : "↳"}</td>
                <td className="mono">{fmtDate(dateOf(r.o))}</td><td>{r.o.contact || <span className="t3">—</span>}</td>
                <td className="mono t2">{loc(db, r.o.sourceLocId).fullName}</td><td className="mono t2">{loc(db, r.o.destLocId).fullName}</td>
                <td><Qty r={r} /></td><td><Badge s={r.o.status} /></td>
              </tr>))}</tbody></table>
        ) : <Empty icon={History} title="No movements match" sub="Try clearing the filters." />}
      </div>
    ) : (
      <div className="flex gap-3" style={{ overflowX: "auto", paddingBottom: 8, alignItems: "flex-start" }}>
        {["DRAFT", "WAITING", "READY", "DONE", "CANCELED"].map((s) => { const items = rows.filter((r) => r.o.status === s); return (
          <div key={s} className="kcol">
            <div className="flex items-center justify-between" style={{ padding: "2px 4px" }}>
              <span className="flex items-center gap-2" style={{ fontWeight: 500 }}><i style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS[s].c, display: "inline-block" }} />{STATUS[s].label}</span><span className="cnt">{items.length}</span></div>
            {items.map((r) => (
              <div key={r.key} className="kcard" role="button" tabIndex={0} style={{ borderLeft: `3px solid ${DIR_COLOR[r.d]}` }} onKeyDown={(e) => e.key === "Enter" && openOp(go, r.o)} onClick={() => openOp(go, r.o)}>
                <div className="mono" style={{ fontWeight: 600 }}>{r.o.reference}</div>
                <div style={{ marginTop: 4, fontSize: 13 }}><Qty r={r} /></div>
                <div className="t3 mono" style={{ fontSize: 12, marginTop: 6 }}>{fmtDate(dateOf(r.o))}</div>
              </div>))}
            {!items.length && <div className="t3" style={{ fontSize: 12, padding: "12px 4px" }}>Nothing here</div>}
          </div>); })}
      </div>)}
  </>);
}

/* =====================================================================
   12. SETTINGS: Warehouse & Location
   ===================================================================== */
function SettingsLayout({ ctx, active, children }) {
  return (
    <div className="flex gap-6 flex-wrap">
      <nav style={{ width: 200 }} aria-label="Settings">
        <div className="upper" style={{ marginBottom: 8 }}>Settings</div>
        {[["settingsWh", "Warehouse", WarehouseIcon], ["settingsLoc", "Location", MapPin]].map(([r, l, I]) => (
          <button key={r} className="mi" onClick={() => ctx.go(r)} style={active === r ? { background: "var(--s2)", boxShadow: "inset 2px 0 0 var(--ac)" } : undefined}><I size={16} className="t2" />{l}</button>))}
      </nav>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
function Warehouses({ ctx }) {
  const { db, user } = ctx; const mgr = user.role === "MANAGER"; const [dr, setDr] = useState(null);
  return (
    <SettingsLayout ctx={ctx} active="settingsWh">
      <PageHeader onNew={() => setDr({})} newDisabled={!mgr} newTitle={mgr ? "New warehouse" : "Only managers can do this"} title="Warehouses" sub="Physical sites where stock is stored" />
      <div className="card">
        <table className="tbl"><thead><tr><th>Name</th><th>Short Code</th><th>Address</th><th className="r">Locations</th></tr></thead>
          <tbody>{db.warehouses.map((w) => (
            <tr key={w.id} className={mgr ? "rc" : ""} tabIndex={mgr ? 0 : -1} title={mgr ? "Edit" : "Only managers can edit"} onKeyDown={(e) => mgr && e.key === "Enter" && setDr(w)} onClick={() => mgr && setDr(w)}>
              <td style={{ fontWeight: 500 }}>{w.name}</td><td className="mono">{w.shortCode}</td><td className="t2">{w.address || "—"}</td>
              <td className="r mono">{db.locations.filter((l) => l.warehouseId === w.id).length}</td></tr>))}</tbody></table>
      </div>
      {dr && <WarehouseDrawer ctx={ctx} w={dr.id ? dr : null} onClose={() => setDr(null)} />}
    </SettingsLayout>
  );
}
function WarehouseDrawer({ ctx, w, onClose }) {
  const { db, run, toast } = ctx;
  const [f, setF] = useState({ id: w?.id, name: w?.name || "", shortCode: w?.shortCode || "", address: w?.address || "" });
  const locked = w && db.operations.some((o) => o.warehouseId === w.id);
  const save = () => { const r = run((d) => saveWarehouse(d, f)); if (r.ok) { toast(`${f.name} saved${w ? "" : ` · location ${f.shortCode.toUpperCase()}/Stock created`}`); onClose(); } };
  return (
    <Drawer title={w ? "Edit Warehouse" : "New Warehouse"} onClose={onClose} footer={<><button className="btn bs" onClick={onClose}>Cancel</button><button className="btn bp" onClick={save} disabled={!f.name.trim() || !f.shortCode.trim()}>Save</button></>}>
      <div className="flex flex-col gap-4">
        <Field label="Name" req><input className="inp" autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Main Warehouse" /></Field>
        <Field label="Short Code" req hint={locked ? "Locked: this warehouse already has operations." : "Used in references, e.g. WH → WH/IN/0001. Can't be changed after the first operation."}>
          <div style={{ position: "relative" }}><input className="inp mono" disabled={locked} maxLength={5} value={f.shortCode} onChange={(e) => setF({ ...f, shortCode: e.target.value.toUpperCase() })} placeholder="WH" />
            {locked && <Lock size={14} className="t3" style={{ position: "absolute", right: 12, top: 11 }} />}</div></Field>
        <Field label="Address"><textarea className="inp" rows={3} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="Plot 14, MIDC, Pune" /></Field>
        {f.shortCode && <div className="t2" style={{ fontSize: 13 }}>References look like <span className="mono" style={{ color: "var(--t)" }}>{f.shortCode.toUpperCase()}/IN/0001</span></div>}
      </div>
    </Drawer>
  );
}
function Locations({ ctx }) {
  const { db, user } = ctx; const mgr = user.role === "MANAGER"; const [dr, setDr] = useState(null);
  const rows = [...db.locations].sort((a, b) => (a.type === "INTERNAL" ? 0 : 1) - (b.type === "INTERNAL" ? 0 : 1));
  const TYPE = { INTERNAL: ["Internal", COL.blue], VENDOR: ["Virtual", COL.gray], CUSTOMER: ["Virtual", COL.gray], LOSS: ["Virtual", COL.gray] };
  return (
    <SettingsLayout ctx={ctx} active="settingsLoc">
      <PageHeader onNew={() => setDr({})} newDisabled={!mgr} newTitle={mgr ? "New location" : "Only managers can do this"} title="Locations" sub="Rooms, racks and shelves inside a warehouse" />
      <div className="card">
        <table className="tbl"><thead><tr><th>Full Name</th><th>Name</th><th>Short Code</th><th>Warehouse</th><th>Type</th></tr></thead>
          <tbody>{rows.map((l) => { const v = l.type !== "INTERNAL"; const edit = mgr && !v; const wh = db.warehouses.find((w) => w.id === l.warehouseId); return (
            <tr key={l.id} className={edit ? "rc" : ""} tabIndex={edit ? 0 : -1} style={v ? { opacity: 0.7 } : undefined} title={v ? "System location (read-only)" : !mgr ? "Only managers can edit" : "Edit"}
              onKeyDown={(e) => edit && e.key === "Enter" && setDr(l)} onClick={() => edit && setDr(l)}>
              <td className="mono" style={{ fontWeight: 600 }}>{l.fullName}</td><td>{l.name}</td><td className="mono t2">{l.shortCode || "—"}</td>
              <td className="t2">{wh ? `${wh.name} (${wh.shortCode})` : "—"}</td>
              <td><span className="flex items-center gap-2"><Pill c={TYPE[l.type][1]}>{TYPE[l.type][0]}</Pill>{v && <Lock size={13} className="t3" />}</span></td>
            </tr>); })}</tbody></table>
      </div>
      {dr && <LocationDrawer ctx={ctx} l={dr.id ? dr : null} onClose={() => setDr(null)} />}
    </SettingsLayout>
  );
}
function LocationDrawer({ ctx, l, onClose }) {
  const { db, run, toast } = ctx;
  const [f, setF] = useState({ id: l?.id, name: l?.name || "", shortCode: l?.shortCode || "", warehouseId: l?.warehouseId || db.warehouses[0]?.id });
  const wh = db.warehouses.find((w) => w.id === Number(f.warehouseId));
  const save = () => { const r = run((d) => saveLocation(d, f)); if (r.ok) { toast(`${r.res.fullName} saved`); onClose(); } };
  return (
    <Drawer title={l ? "Edit Location" : "New Location"} onClose={onClose} footer={<><button className="btn bs" onClick={onClose}>Cancel</button><button className="btn bp" onClick={save} disabled={!f.name.trim() || !f.shortCode.trim()}>Save</button></>}>
      <div className="flex flex-col gap-4">
        <Field label="Name" req><input className="inp" autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Rack B" /></Field>
        <Field label="Short Code" req><input className="inp mono" value={f.shortCode} maxLength={12} onChange={(e) => setF({ ...f, shortCode: e.target.value.replace(/\s/g, "") })} placeholder="RackB" /></Field>
        <Field label="Warehouse" req><select className="inp" value={f.warehouseId} onChange={(e) => setF({ ...f, warehouseId: Number(e.target.value) })}>
          {db.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.shortCode})</option>)}</select></Field>
        <div className="t2" style={{ fontSize: 13 }}>Full name: <span className="mono" style={{ color: "var(--t)" }}>{wh?.shortCode}/{f.shortCode || "…"}</span></div>
      </div>
    </Drawer>
  );
}

/* =====================================================================
   13. PROFILE & 404
   ===================================================================== */
function Profile({ ctx }) {
  const { run, toast, user, logout } = ctx;
  const [name, setName] = useState(user.name); const [edit, setEdit] = useState(false); const [pw, setPw] = useState({ c: "", a: "", b: "" });
  const saveName = () => { const r = run((d) => { if (!name.trim()) fail("Name is required"); d.users.find((u) => u.id === user.id).name = name.trim(); }); if (r.ok) { toast("Profile updated"); setEdit(false); } };
  const pwReady = pw.c && pwOk(pw.a) && pw.a === pw.b;
  const changePw = () => { if (!pwReady) return; const r = run((d) => { const u = d.users.find((x) => x.id === user.id);
    if (u.password !== pw.c) fail("Current password is incorrect"); u.password = pw.a; });
    if (r.ok) { toast("Password updated"); setPw({ c: "", a: "", b: "" }); } };
  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <PageHeader title="My Profile" />
      <div className="card" style={{ padding: 24 }}>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="mono" style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--acs)", color: "var(--ac)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 600 }}>{initials(user.name)}</div>
          <div style={{ flex: 1 }}>
            {edit ? <div className="flex gap-2"><input className="inp" autoFocus value={name} onChange={(e) => setName(e.target.value)} style={{ maxWidth: 280 }} onKeyDown={(e) => e.key === "Enter" && saveName()} />
              <button className="btn bp" onClick={saveName}>Save</button><button className="btn bs" onClick={() => { setEdit(false); setName(user.name); }}>Cancel</button></div>
              : <div className="flex items-center gap-2"><span className="h-title">{user.name}</span><button className="ibtn" aria-label="Edit name" onClick={() => setEdit(true)}><Pencil size={15} /></button></div>}
            <div className="flex items-center gap-2" style={{ marginTop: 4 }}><Pill c={user.role === "MANAGER" ? COL.blue : COL.gray}>{user.role === "MANAGER" ? "Manager" : "Staff"}</Pill><span className="t3" style={{ fontSize: 13 }}>Member since {fmtDate(user.createdAt)}</span></div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2" style={{ marginTop: 24 }}>
          <Field label="Login ID"><ReadVal mono><Lock size={14} className="t3" />{user.loginId}</ReadVal></Field>
          <Field label="Email"><ReadVal>{user.email}</ReadVal></Field>
        </div>
      </div>
      <EnterBox className="card" style={{ padding: 24, marginTop: 16 }} onSubmit={changePw}>
        <div className="h-sec" style={{ marginBottom: 16 }}>Change Password</div>
        <div className="flex flex-col gap-4" style={{ maxWidth: 400 }}>
          <Field label="Current password"><PwInput value={pw.c} onChange={(v) => setPw({ ...pw, c: v })} /></Field>
          <Field label="New password"><PwInput value={pw.a} onChange={(v) => setPw({ ...pw, a: v })} /><RuleList pw={pw.a} /></Field>
          <Field label="Confirm new password" error={pw.b && pw.a !== pw.b ? "Passwords don't match" : ""}><PwInput value={pw.b} onChange={(v) => setPw({ ...pw, b: v })} /></Field>
          <div><button className="btn bp" onClick={changePw} disabled={!pwReady}>Update password</button></div>
        </div>
      </EnterBox>
      <button className="btn bd" style={{ marginTop: 16 }} onClick={logout}><LogOut size={16} />Log out</button>
    </div>
  );
}
function NotFound({ ctx }) {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <PackageX size={48} className="t3" style={{ margin: "0 auto" }} />
        <div className="mono t3" style={{ fontSize: 32, marginTop: 12 }}>404</div>
        <div className="h-title" style={{ marginTop: 8 }}>This shelf is empty.</div>
        <div className="t2" style={{ marginTop: 4 }}>The page you're looking for doesn't exist or was moved.</div>
        <button className="btn bp" style={{ marginTop: 20 }} onClick={() => ctx.go("dashboard")}>Back to Dashboard</button>
      </div>
    </div>
  );
}
