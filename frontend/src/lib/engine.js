// Read-only selectors over the data snapshot the API returns. All changes happen on the server
// (backend/src/inventory.ts); these helpers only derive what screens display.
import { COL, PENDING } from './constants';
import { startOfToday, fmtQty } from './format';

const DAY = 864e5;

export const fail = (m) => { throw new Error(m); };
export const loc = (db, id) => db.locations.find((l) => l.id === id);
export const prod = (db, id) => db.products.find((p) => p.id === id);
export const userName = (db, id) => db.users.find((u) => u.id === id)?.name || "—";
export const virtualId = (db, type) => db.locations.find((l) => l.type === type).id;
export const qKey = (p, l) => `${p}:${l}`;
export const qtyAt = (db, p, l) => db.quants[qKey(p, l)] || 0;
export const internalLocs = (db, whId) => db.locations.filter((l) => l.type === "INTERNAL" && (!whId || l.warehouseId === whId));
export const onHand = (db, p, whId) => internalLocs(db, whId).reduce((s, l) => s + qtyAt(db, p, l.id), 0);
export const isOut = (o) => o.type === "DELIVERY" || o.type === "INTERNAL";
export const reservedAt = (db, p, l, exclude) =>
  db.operations.filter((o) => o.status === "READY" && isOut(o) && o.sourceLocId === l && o.id !== exclude)
    .reduce((s, o) => s + o.lines.filter((x) => x.productId === p).reduce((a, x) => a + x.quantity, 0), 0);
export const freeAt = (db, p, l, exclude) => qtyAt(db, p, l) - reservedAt(db, p, l, exclude);
export const freeTotal = (db, p, whId) => internalLocs(db, whId).reduce((s, l) => s + freeAt(db, p, l.id), 0);
export const shortLines = (db, op) => op.lines.filter((l) => freeAt(db, l.productId, op.sourceLocId, op.id) < l.quantity);
export const isAvailable = (db, op) => shortLines(db, op).length === 0;
export const isLate = (o) => PENDING.includes(o.status) && o.scheduledDate < startOfToday();
export const isUpcoming = (o) => PENDING.includes(o.status) && o.scheduledDate >= startOfToday() + DAY;
export const matchQ = (o, q) => (o.reference + " " + (o.contact || "")).toLowerCase().includes(q.trim().toLowerCase());
export const dateOf = (o) => o.doneDate || o.scheduledDate;
export const dirOf = (db, o) => {
  const s = loc(db, o.sourceLocId).type, t = loc(db, o.destLocId).type;
  return t === "INTERNAL" && s !== "INTERNAL" ? "IN" : s === "INTERNAL" && t !== "INTERNAL" ? "OUT" : "INT";
};
export const DIR_COLOR = { IN: COL.green, OUT: COL.red, INT: COL.t2 };
export const signed = (dir, q) => (dir === "IN" ? "+" : dir === "OUT" ? "−" : "⇄ ") + fmtQty(q);
export const stockStatus = (oh, fr, min) => (oh <= 0 ? ["Out", COL.red] : fr <= min ? ["Low", COL.amber] : ["In stock", COL.green]);
