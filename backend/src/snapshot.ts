import type { User } from '@prisma/client';
import { prisma } from './db.js';
import { publicUser } from './auth.js';

const ms = (d: Date) => d.getTime();
const num = (d: { toNumber(): number }) => d.toNumber();

// The whole dataset in the shape frontend/src/lib/engine.js reads. Fine at hackathon scale;
// swap for per-screen endpoints (phases.md, Phase 3) once data grows.
export async function snapshot() {
  const [users, warehouses, locations, categories, products, operations, quants, moves] = await Promise.all([
    prisma.user.findMany({ orderBy: { id: 'asc' } }),
    prisma.warehouse.findMany({ orderBy: { id: 'asc' } }),
    prisma.location.findMany({ orderBy: { id: 'asc' } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.product.findMany({ orderBy: { id: 'asc' } }),
    prisma.operation.findMany({ include: { lines: { orderBy: { id: 'asc' } } }, orderBy: { id: 'desc' } }),
    prisma.quant.findMany(),
    prisma.stockMove.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] }),
  ]);
  return {
    // Other users' emails stay private; names are needed for "Responsible" and "By" columns
    users: users.map((u) => ({ id: u.id, loginId: u.loginId, name: u.name, role: u.role })),
    warehouses: warehouses.map((w) => ({ id: w.id, name: w.name, shortCode: w.shortCode, address: w.address ?? '' })),
    locations: locations.map((l) => ({
      id: l.id, name: l.name, shortCode: l.shortCode ?? '', fullName: l.fullName, type: l.type, warehouseId: l.warehouseId,
    })),
    categories: categories.map((c) => ({ id: c.id, name: c.name })),
    products: products.map((p) => ({
      id: p.id, sku: p.sku, name: p.name, categoryId: p.categoryId, uom: p.uom, unitCost: num(p.unitCost),
      reorderMin: num(p.reorderMin), reorderMax: num(p.reorderMax), createdAt: ms(p.createdAt),
    })),
    operations: operations.map((o) => ({
      id: o.id, reference: o.reference, type: o.type, status: o.status, warehouseId: o.warehouseId,
      contact: o.contact ?? '', deliveryAddress: o.deliveryAddress ?? '', sourceLocId: o.sourceLocId, destLocId: o.destLocId,
      scheduledDate: ms(o.scheduledDate), doneDate: o.doneDate ? ms(o.doneDate) : null, responsibleId: o.responsibleId,
      note: o.note ?? '', createdAt: ms(o.createdAt),
      lines: o.lines.map((l) => ({ productId: l.productId, quantity: num(l.quantity) })),
    })),
    quants: Object.fromEntries(quants.map((q) => [`${q.productId}:${q.locationId}`, num(q.quantity)])),
    moves: moves.map((m) => ({
      id: m.id, operationId: m.operationId, reference: m.reference, productId: m.productId, sourceLocId: m.sourceLocId,
      destLocId: m.destLocId, quantity: num(m.quantity), userId: m.userId, createdAt: ms(m.createdAt),
    })),
  };
}

export async function payload(me: User, res: unknown = null) {
  return { res, me: publicUser(me), db: await snapshot() };
}
