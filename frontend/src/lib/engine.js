import { COL, STATUS, PENDING, TYPE_CODE } from './constants';
import { startOfToday, fmtQty, dayOffset } from './format';

const DAY = 864e5;

/* ---------- selectors (pure) ---------- */
export const fail = (m) => { throw new Error(m); };
export const loc = (db, id) => db.locations.find((l) => l.id === id);
export const prod = (db, id) => db.products.find((p) => p.id === id);
export const getOp = (db, id) => db.operations.find((o) => o.id === id) || fail("Operation not found");
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

/* ---------- mutations ---------- */
export function nextRef(db, whId, type) {
  const wh = db.warehouses.find((w) => w.id === whId) || fail("Warehouse not found");
  const k = `${whId}:${type}`; const n = db.seq[k] || 1; db.seq[k] = n + 1;
  return `${wh.shortCode}/${TYPE_CODE[type]}/${String(n).padStart(4, "0")}`;
}
export function validateHeader(d) {
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
export function createOp(db, d, userId) {
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
export function updateOp(db, id, d) {
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
export function todoOp(db, id) {
  const op = getOp(db, id);
  if (op.status !== "DRAFT") fail("Only draft operations can be marked To Do");
  if (!op.lines.length) fail("Add at least one product");
  op.status = op.type === "RECEIPT" || isAvailable(db, op) ? "READY" : "WAITING";
  return op;
}
export function recheckWaiting(db) {
  const promoted = [];
  db.operations.filter((o) => o.status === "WAITING").sort((a, b) => a.scheduledDate - b.scheduledDate)
    .forEach((o) => { if (isAvailable(db, o)) { o.status = "READY"; promoted.push(o.reference); } });
  return promoted;
}
export function checkAvail(db, id) {
  const op = getOp(db, id);
  if (op.status !== "WAITING") fail("Only waiting operations can be re-checked");
  if (isAvailable(db, op)) op.status = "READY";
  return op;
}
export function validateOp(db, id, userId, at = Date.now()) {
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
export function cancelOp(db, id) {
  const op = getOp(db, id);
  if (!PENDING.includes(op.status)) fail(`Cannot cancel a ${STATUS[op.status].label} operation`);
  op.status = "CANCELED";
  recheckWaiting(db);
  return op;
}
export function adjust(db, { productId, locationId, counted, reason }, userId, at = Date.now()) {
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
export function saveProduct(db, d, userId) {
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
  if (init > 0) {
    const l = loc(db, Number(d.locationId));
    const op = createOp(db, { type: "RECEIPT", contact: "Opening stock", sourceLocId: virtualId(db, "VENDOR"), destLocId: l.id,
      warehouseId: l.warehouseId, scheduledDate: Date.now(), lines: [{ productId: p.id, quantity: init }] }, userId);
    todoOp(db, op.id); validateOp(db, op.id, userId);
    return { id: p.id, ref: op.reference };
  }
  return { id: p.id };
}
export function saveWarehouse(db, d) {
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
export function saveLocation(db, d) {
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
