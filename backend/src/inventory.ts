// Business rules for stock. A port of frontend/src/lib/engine.js; every exported command runs inside a caller's transaction.
import { Prisma, type LocationType, type OperationStatus, type OperationType } from '@prisma/client';
import type { Tx } from './db.js';
import { fail } from './errors.js';

const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);
const ZERO = D(0);
const TYPE_CODE: Record<OperationType, string> = { RECEIPT: 'IN', DELIVERY: 'OUT', INTERNAL: 'INT', ADJUSTMENT: 'ADJ' };
const STATUS_LABEL: Record<OperationStatus, string> = { DRAFT: 'Draft', WAITING: 'Waiting', READY: 'Ready', DONE: 'Done', CANCELED: 'Canceled' };
const PENDING: OperationStatus[] = ['DRAFT', 'WAITING', 'READY'];
const OUTGOING: OperationType[] = ['DELIVERY', 'INTERNAL'];
// [source type, destination type] each operation type must move between
const ROUTE: Record<OpInput['type'], [LocationType, LocationType]> = {
  RECEIPT: ['VENDOR', 'INTERNAL'], DELIVERY: ['INTERNAL', 'CUSTOMER'], INTERNAL: ['INTERNAL', 'INTERNAL'],
};

export type OpInput = {
  type: 'RECEIPT' | 'DELIVERY' | 'INTERNAL';
  contact: string;
  deliveryAddress: string;
  scheduledDate: number;
  sourceLocId: number;
  destLocId: number;
  lines: { productId: number; quantity: number }[];
};

/* ---------- stock queries ---------- */
async function qtyAt(tx: Tx, productId: number, locationId: number) {
  const q = await tx.quant.findUnique({ where: { productId_locationId: { productId, locationId } } });
  return q?.quantity ?? ZERO;
}

// Stock promised to Ready deliveries/transfers leaving this location, optionally ignoring one operation
async function reservedAt(tx: Tx, productId: number, locationId: number, excludeOpId?: number) {
  const r = await tx.operationLine.aggregate({
    _sum: { quantity: true },
    where: {
      productId,
      operation: { status: 'READY', type: { in: OUTGOING }, sourceLocId: locationId, ...(excludeOpId ? { id: { not: excludeOpId } } : {}) },
    },
  });
  return r._sum.quantity ?? ZERO;
}

async function freeAt(tx: Tx, productId: number, locationId: number, excludeOpId?: number) {
  return (await qtyAt(tx, productId, locationId)).minus(await reservedAt(tx, productId, locationId, excludeOpId));
}

async function isAvailable(tx: Tx, op: { id: number; sourceLocId: number; lines: { productId: number; quantity: Prisma.Decimal }[] }) {
  for (const l of op.lines) if ((await freeAt(tx, l.productId, op.sourceLocId, op.id)).lt(l.quantity)) return false;
  return true;
}

async function getOp(tx: Tx, id: number) {
  const op = await tx.operation.findUnique({ where: { id }, include: { lines: true, sourceLoc: true, destLoc: true } });
  if (!op) fail('Operation not found', 404, 'NOT_FOUND');
  return op;
}

async function virtualLoc(tx: Tx, type: LocationType) {
  const l = await tx.location.findFirst({ where: { type, warehouseId: null } });
  return l ?? fail(`System location ${type} is missing. Run the database seed.`, 500, 'MISCONFIGURED');
}

async function nextRef(tx: Tx, warehouseId: number, type: OperationType) {
  const wh = await tx.warehouse.findUnique({ where: { id: warehouseId } });
  if (!wh) fail('Warehouse not found', 404, 'NOT_FOUND');
  const seq = await tx.operationSequence.upsert({
    where: { warehouseId_operationType: { warehouseId, operationType: type } },
    create: { warehouseId, operationType: type, nextVal: 2 },
    update: { nextVal: { increment: 1 } },
  });
  return `${wh.shortCode}/${TYPE_CODE[type]}/${String(seq.nextVal - 1).padStart(4, '0')}`;
}

// Validates the header and returns the warehouse the operation belongs to
async function checkHeader(tx: Tx, d: OpInput) {
  if (d.sourceLocId === d.destLocId) fail('Source and destination must be different');
  if (d.type === 'RECEIPT' && !d.contact) fail('Receive From is required', 400, 'VALIDATION', { contact: 'Required' });
  if (d.type === 'DELIVERY' && !d.deliveryAddress) fail('Delivery address is required', 400, 'VALIDATION', { deliveryAddress: 'Required' });
  const ids = d.lines.map((l) => l.productId);
  if (new Set(ids).size !== ids.length) fail('Each product can appear only once');
  if (ids.length && (await tx.product.count({ where: { id: { in: ids } } })) !== ids.length) fail('One of the products no longer exists');
  const src = await tx.location.findUnique({ where: { id: d.sourceLocId } });
  const dst = await tx.location.findUnique({ where: { id: d.destLocId } });
  if (!src || !dst) fail('Location not found', 404, 'NOT_FOUND');
  const [wantSrc, wantDst] = ROUTE[d.type];
  if (src.type !== wantSrc || dst.type !== wantDst) fail("Those locations don't fit this operation type");
  const warehouseId = d.type === 'RECEIPT' ? dst.warehouseId : src.warehouseId;
  return warehouseId ?? fail('Pick a warehouse location');
}

const lineData = (d: OpInput) => d.lines.map((l) => ({ productId: l.productId, quantity: D(l.quantity) }));

/* ---------- operation commands ---------- */
export async function createOp(tx: Tx, d: OpInput, userId: number) {
  const warehouseId = await checkHeader(tx, d);
  const reference = await nextRef(tx, warehouseId, d.type);
  return tx.operation.create({
    data: {
      reference, type: d.type, warehouseId, contact: d.contact, deliveryAddress: d.deliveryAddress,
      sourceLocId: d.sourceLocId, destLocId: d.destLocId, scheduledDate: new Date(d.scheduledDate),
      responsibleId: userId, lines: { create: lineData(d) },
    },
  });
}

export async function updateOp(tx: Tx, id: number, d: OpInput) {
  const op = await getOp(tx, id);
  if (op.status !== 'DRAFT') fail('Only draft operations can be edited', 409, 'INVALID_STATE');
  if (op.type !== d.type) fail("An operation's type can't change after it's created");
  const warehouseId = await checkHeader(tx, d);
  // The reference (e.g. WH/IN/0007) encodes the warehouse, so a draft can't move to another one
  if (warehouseId !== op.warehouseId) fail(`${op.reference} belongs to its original warehouse. Pick a location there, or create a new operation.`);
  await tx.operationLine.deleteMany({ where: { operationId: id } });
  return tx.operation.update({
    where: { id },
    data: {
      contact: d.contact, deliveryAddress: d.deliveryAddress, scheduledDate: new Date(d.scheduledDate),
      sourceLocId: d.sourceLocId, destLocId: d.destLocId, lines: { create: lineData(d) },
    },
  });
}

export async function todoOp(tx: Tx, id: number) {
  const op = await getOp(tx, id);
  if (op.status !== 'DRAFT') fail('Only draft operations can be marked To Do', 409, 'INVALID_STATE');
  if (!op.lines.length) fail('Add at least one product');
  const status = op.type === 'RECEIPT' || (await isAvailable(tx, op)) ? 'READY' : 'WAITING';
  return tx.operation.update({ where: { id }, data: { status } });
}

// Promotes Waiting operations to Ready in schedule order; each promotion reserves stock before the next is checked
async function recheckWaiting(tx: Tx) {
  const waiting = await tx.operation.findMany({
    where: { status: 'WAITING' }, include: { lines: true }, orderBy: [{ scheduledDate: 'asc' }, { id: 'asc' }],
  });
  const promoted: string[] = [];
  for (const o of waiting) {
    if (await isAvailable(tx, o)) {
      await tx.operation.update({ where: { id: o.id }, data: { status: 'READY' } });
      promoted.push(o.reference);
    }
  }
  return promoted;
}

export async function checkAvail(tx: Tx, id: number) {
  const op = await getOp(tx, id);
  if (op.status !== 'WAITING') fail('Only waiting operations can be re-checked', 409, 'INVALID_STATE');
  const status: OperationStatus = (await isAvailable(tx, op)) ? 'READY' : 'WAITING';
  if (status === 'READY') await tx.operation.update({ where: { id }, data: { status } });
  return status;
}

export async function validateOp(tx: Tx, id: number, userId: number, at = new Date()) {
  const op = await getOp(tx, id);
  if (op.status !== 'READY') fail(`Cannot validate a ${STATUS_LABEL[op.status]} operation`, 409, 'INVALID_STATE');
  if (!op.lines.length) fail('Add at least one product');
  const src = op.sourceLoc, dst = op.destLoc;
  if (src.type === 'INTERNAL') {
    for (const l of op.lines) {
      if ((await qtyAt(tx, l.productId, src.id)).lt(l.quantity)) {
        const p = await tx.product.findUnique({ where: { id: l.productId } });
        fail(`Insufficient stock for ${p?.name ?? 'a product'} at ${src.fullName}`, 409, 'INSUFFICIENT_STOCK');
      }
    }
  }
  for (const l of op.lines) {
    if (src.type === 'INTERNAL') {
      await tx.quant.update({
        where: { productId_locationId: { productId: l.productId, locationId: src.id } },
        data: { quantity: { decrement: l.quantity } },
      });
    }
    if (dst.type === 'INTERNAL') {
      await tx.quant.upsert({
        where: { productId_locationId: { productId: l.productId, locationId: dst.id } },
        create: { productId: l.productId, locationId: dst.id, quantity: l.quantity },
        update: { quantity: { increment: l.quantity } },
      });
    }
    await tx.stockMove.create({
      data: {
        operationId: op.id, reference: op.reference, productId: l.productId, sourceLocId: src.id, destLocId: dst.id,
        quantity: l.quantity, userId, createdAt: at,
      },
    });
  }
  await tx.operation.update({ where: { id }, data: { status: 'DONE', doneDate: at } });
  return { promoted: await recheckWaiting(tx) };
}

export async function cancelOp(tx: Tx, id: number) {
  const op = await getOp(tx, id);
  if (!PENDING.includes(op.status)) fail(`Cannot cancel a ${STATUS_LABEL[op.status]} operation`, 409, 'INVALID_STATE');
  await tx.operation.update({ where: { id }, data: { status: 'CANCELED' } });
  return { promoted: await recheckWaiting(tx) };
}

export async function adjust(
  tx: Tx, d: { productId: number; locationId: number; counted: number; reason: string }, userId: number, at = new Date(),
) {
  const l = await tx.location.findUnique({ where: { id: d.locationId } });
  if (!l || l.type !== 'INTERNAL' || l.warehouseId === null) fail('Pick a warehouse location');
  if (!(await tx.product.findUnique({ where: { id: d.productId } }))) fail('Product not found', 404, 'NOT_FOUND');
  const diff = D(d.counted).minus(await qtyAt(tx, d.productId, l.id));
  if (diff.isZero()) fail('No change to apply');
  const loss = await virtualLoc(tx, 'LOSS');
  const up = diff.gt(0);
  const op = await tx.operation.create({
    data: {
      reference: await nextRef(tx, l.warehouseId, 'ADJUSTMENT'), type: 'ADJUSTMENT', status: 'READY', warehouseId: l.warehouseId,
      sourceLocId: up ? loss.id : l.id, destLocId: up ? l.id : loss.id, scheduledDate: at, responsibleId: userId,
      note: d.reason || 'Count correction', lines: { create: [{ productId: d.productId, quantity: diff.abs() }] },
    },
  });
  await validateOp(tx, op.id, userId, at);
  return { id: op.id, reference: op.reference, diff: diff.toNumber() };
}

/* ---------- catalog & settings ---------- */
export type ProductInput = {
  name: string; sku: string; category: string; uom: string; unitCost: number;
  reorderMin: number; reorderMax: number; initial: number; locationId?: number | undefined;
};

export async function saveProduct(tx: Tx, d: ProductInput, userId: number, id?: number) {
  const name = d.name.trim(), sku = d.sku.trim().toUpperCase();
  if (!name) fail('Name is required', 400, 'VALIDATION', { name: 'Required' });
  if (!/^[A-Z0-9-]{3,12}$/.test(sku)) fail('SKU must be 3–12 letters, numbers or dashes', 400, 'VALIDATION', { sku: 'Invalid SKU' });
  if (await tx.product.findFirst({ where: { sku, ...(id ? { id: { not: id } } : {}) } })) {
    fail(`SKU ${sku} already exists`, 409, 'DUPLICATE', { sku: 'This SKU already exists' });
  }
  if (d.reorderMax && d.reorderMax < d.reorderMin) fail('Reorder max must be at least the min');
  let categoryId: number | null = null;
  const cn = d.category.trim();
  if (cn) {
    const c = (await tx.category.findFirst({ where: { name: { equals: cn, mode: 'insensitive' } } }))
      ?? (await tx.category.create({ data: { name: cn } }));
    categoryId = c.id;
  }
  const fields = {
    name, sku, categoryId, uom: d.uom, unitCost: D(d.unitCost), reorderMin: D(d.reorderMin), reorderMax: D(d.reorderMax),
  };
  if (id) {
    if (!(await tx.product.findUnique({ where: { id } }))) fail('Product not found', 404, 'NOT_FOUND');
    await tx.product.update({ where: { id }, data: fields });
    return { id };
  }
  const p = await tx.product.create({ data: fields });
  if (d.initial > 0) {
    // Opening stock goes through a validated receipt so the ledger explains every unit
    const vendor = await virtualLoc(tx, 'VENDOR');
    const op = await createOp(tx, {
      type: 'RECEIPT', contact: 'Opening stock', deliveryAddress: '', scheduledDate: Date.now(),
      sourceLocId: vendor.id, destLocId: d.locationId ?? fail('Pick a location for the initial stock'),
      lines: [{ productId: p.id, quantity: d.initial }],
    }, userId);
    await todoOp(tx, op.id);
    await validateOp(tx, op.id, userId);
    return { id: p.id, ref: op.reference };
  }
  return { id: p.id };
}

export async function setReorder(tx: Tx, id: number, min: number, max: number) {
  if (max && max < min) fail('Max must be at least min');
  if (!(await tx.product.findUnique({ where: { id } }))) fail('Product not found', 404, 'NOT_FOUND');
  await tx.product.update({ where: { id }, data: { reorderMin: D(min), reorderMax: D(max) } });
}

export async function deleteProduct(tx: Tx, id: number) {
  const used = (await tx.operationLine.count({ where: { productId: id } })) + (await tx.stockMove.count({ where: { productId: id } }));
  if (used) fail("Products with stock history can't be deleted", 409, 'IN_USE');
  await tx.product.delete({ where: { id } });
}

export async function saveWarehouse(tx: Tx, d: { name: string; shortCode: string; address: string }, id?: number) {
  const name = d.name.trim(), code = d.shortCode.trim().toUpperCase();
  if (!name) fail('Name is required');
  if (!/^[A-Z0-9]{2,5}$/.test(code)) fail('Short code must be 2–5 letters or numbers');
  if (await tx.warehouse.findFirst({ where: { shortCode: code, ...(id ? { id: { not: id } } : {}) } })) {
    fail(`Short code ${code} is already used`, 409, 'DUPLICATE');
  }
  if (id) {
    const w = await tx.warehouse.findUnique({ where: { id } });
    if (!w) fail('Warehouse not found', 404, 'NOT_FOUND');
    if (w.shortCode !== code) {
      if (await tx.operation.count({ where: { warehouseId: id } })) fail("Short code can't change after the first operation", 409, 'LOCKED');
      for (const l of await tx.location.findMany({ where: { warehouseId: id } })) {
        await tx.location.update({ where: { id: l.id }, data: { fullName: `${code}/${l.shortCode}` } });
      }
    }
    return tx.warehouse.update({ where: { id }, data: { name, shortCode: code, address: d.address } });
  }
  const w = await tx.warehouse.create({ data: { name, shortCode: code, address: d.address } });
  await tx.location.create({ data: { name: 'Stock', shortCode: 'Stock', fullName: `${code}/Stock`, type: 'INTERNAL', warehouseId: w.id } });
  return w;
}

export async function saveLocation(tx: Tx, d: { name: string; shortCode: string; warehouseId: number }, id?: number) {
  const name = d.name.trim(), code = d.shortCode.trim();
  if (!name) fail('Name is required');
  if (!/^[A-Za-z0-9-]{2,12}$/.test(code)) fail('Short code must be 2–12 letters, numbers or dashes');
  const wh = await tx.warehouse.findUnique({ where: { id: d.warehouseId } });
  if (!wh) fail('Select a warehouse');
  if (id) {
    const cur = await tx.location.findUnique({ where: { id } });
    if (!cur) fail('Location not found', 404, 'NOT_FOUND');
    if (cur.type !== 'INTERNAL') fail("System locations can't be edited", 403, 'FORBIDDEN');
    if (cur.warehouseId !== wh.id && (await tx.operation.count({ where: { OR: [{ sourceLocId: id }, { destLocId: id }] } }))) {
      fail("A location with history can't move to another warehouse", 409, 'LOCKED');
    }
  }
  const clash = await tx.location.findFirst({
    where: { warehouseId: wh.id, shortCode: { equals: code, mode: 'insensitive' }, ...(id ? { id: { not: id } } : {}) },
  });
  if (clash) fail(`${wh.shortCode}/${code} already exists`, 409, 'DUPLICATE');
  const fields = { name, shortCode: code, warehouseId: wh.id, fullName: `${wh.shortCode}/${code}` };
  return id
    ? tx.location.update({ where: { id }, data: fields })
    : tx.location.create({ data: { ...fields, type: 'INTERNAL' } });
}
