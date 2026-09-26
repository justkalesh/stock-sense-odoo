// bootstrap: system locations every environment needs. demo (SEED_DEMO=true): port of frontend/src/lib/seed.js,
// built through the real service functions so the ledger is consistent. Safe to rerun: demo data is skipped once users exist.
import type { LocationType } from '@prisma/client';
import { prisma } from '../src/db.js';
import { env } from '../src/env.js';
import { hashPassword } from '../src/auth.js';
import { adjust, cancelOp, createOp, todoOp, validateOp, type OpInput } from '../src/inventory.js';

const DAY = 864e5;
const at = (days: number, hour = 10) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return new Date(d.getTime() + days * DAY + hour * 3600e3);
};

async function bootstrap() {
  const system: [LocationType, string, string][] = [
    ['VENDOR', 'Vendors', 'Vendor'], ['CUSTOMER', 'Customers', 'Customer'], ['LOSS', 'Inventory Loss', 'Inventory Loss'],
  ];
  for (const [type, name, fullName] of system) {
    if (!(await prisma.location.findFirst({ where: { type, warehouseId: null } }))) {
      await prisma.location.create({ data: { type, name, fullName } });
    }
  }
}

async function demo() {
  if (await prisma.user.count()) {
    console.log('Users already exist; skipping demo data.');
    return;
  }
  await prisma.$transaction(async (tx) => {
    const [arjun] = await Promise.all([
      tx.user.create({ data: { loginId: 'arjunk', name: 'Arjun Kumar', email: 'arjun@stocksense.in', role: 'MANAGER', passwordHash: await hashPassword('Admin@123'), createdAt: at(-30) } }),
      tx.user.create({ data: { loginId: 'priyas', name: 'Priya Sharma', email: 'priya@stocksense.in', role: 'STAFF', passwordHash: await hashPassword('Staff@123'), createdAt: at(-20) } }),
    ]);
    const U = arjun!.id;
    const wh = await tx.warehouse.create({ data: { name: 'Main Warehouse', shortCode: 'WH', address: 'Plot 14, MIDC, Pune' } });
    const wh2 = await tx.warehouse.create({ data: { name: 'Secondary Warehouse', shortCode: 'WH2', address: 'Sector 5, Noida' } });
    const mkLoc = (warehouseId: number, code: string, name: string, shortCode: string) =>
      tx.location.create({ data: { name, shortCode, fullName: `${code}/${shortCode}`, type: 'INTERNAL', warehouseId } });
    const L1 = (await mkLoc(wh.id, 'WH', 'Stock 1', 'Stock1')).id;
    const L2 = (await mkLoc(wh.id, 'WH', 'Stock 2', 'Stock2')).id;
    const RACK = (await mkLoc(wh.id, 'WH', 'Rack A', 'RackA')).id;
    await mkLoc(wh2.id, 'WH2', 'Stock 1', 'Stock1');
    const V = (await tx.location.findFirstOrThrow({ where: { type: 'VENDOR' } })).id;
    const C = (await tx.location.findFirstOrThrow({ where: { type: 'CUSTOMER' } })).id;

    const cat: Record<string, number> = {};
    for (const name of ['Furniture', 'Raw Material', 'Hardware', 'Consumables']) cat[name] = (await tx.category.create({ data: { name } })).id;
    const P: Record<string, number> = {};
    const products: [string, string, string, string, number, number, number][] = [
      ['DESK001', 'Desk', 'Furniture', 'Units', 3000, 10, 60],
      ['TBL003', 'Table', 'Furniture', 'Units', 3000, 10, 60],
      ['CHR002', 'Chair', 'Furniture', 'Units', 850, 10, 40],
      ['STL010', 'Steel Rods', 'Raw Material', 'kg', 62, 20, 150],
      ['BLT005', 'Bolts M8', 'Hardware', 'Box', 120, 50, 120],
      ['PNT007', 'Paint 1L', 'Consumables', 'L', 340, 15, 100],
      ['PLY004', 'Plywood Sheet', 'Raw Material', 'Units', 1450, 5, 30],
    ];
    for (const [sku, name, c, uom, unitCost, reorderMin, reorderMax] of products) {
      P[sku] = (await tx.product.create({ data: { sku, name, categoryId: cat[c] ?? null, uom, unitCost, reorderMin, reorderMax } })).id;
    }

    const mk = (type: OpInput['type'], o: { contact?: string; addr?: string; src: number; dst: number; day: number; lines: [string, number][] }) =>
      createOp(tx, {
        type, contact: o.contact ?? '', deliveryAddress: o.addr ?? '', scheduledDate: at(o.day).getTime(),
        sourceLocId: o.src, destLocId: o.dst, lines: o.lines.map(([sku, quantity]) => ({ productId: P[sku]!, quantity })),
      }, U);
    const done = async (op: { id: number }, when: Date) => { await todoOp(tx, op.id); await validateOp(tx, op.id, U, when); };

    // history (Done)
    await done(await mk('RECEIPT', { contact: 'Azure Interior', src: V, dst: L1, day: -6, lines: [['DESK001', 50], ['TBL003', 50]] }), at(-6, 11));
    await done(await mk('RECEIPT', { contact: 'Steel Mart', src: V, dst: L1, day: -5, lines: [['STL010', 100], ['BLT005', 12]] }), at(-5, 12));
    await done(await mk('RECEIPT', { contact: 'Kumar Traders', src: V, dst: L1, day: -4, lines: [['CHR002', 10], ['PNT007', 80]] }), at(-4, 10));
    await done(await mk('INTERNAL', { src: L1, dst: RACK, day: -3, lines: [['STL010', 40]] }), at(-3, 9));
    await done(await mk('DELIVERY', { contact: 'Azure Interior', addr: '12 MG Road, Pune', src: L1, dst: C, day: -3, lines: [['CHR002', 6]] }), at(-3, 16));
    await done(await mk('DELIVERY', { contact: 'Sharma & Co', addr: '44 Industrial Area, Ludhiana', src: L1, dst: C, day: -2, lines: [['STL010', 57]] }), at(-2, 14));
    await done(await mk('DELIVERY', { contact: 'Kumar Traders', addr: '7 Mall Road, Jalandhar', src: L1, dst: C, day: -1, lines: [['PNT007', 10]] }), at(-1, 12));
    await adjust(tx, { productId: P.STL010!, locationId: RACK, counted: 37, reason: 'Damaged' }, U, at(-1, 15));
    // pending work
    await todoOp(tx, (await mk('RECEIPT', { contact: 'Vendor Co.', src: V, dst: RACK, day: -1, lines: [['BLT005', 50]] })).id);
    await todoOp(tx, (await mk('RECEIPT', { contact: 'Steel Mart', src: V, dst: L1, day: 1, lines: [['STL010', 60]] })).id);
    await mk('RECEIPT', { contact: 'Kumar Traders', src: V, dst: L1, day: 2, lines: [['CHR002', 20]] });
    await cancelOp(tx, (await mk('RECEIPT', { contact: 'Azure Interior', src: V, dst: L1, day: -2, lines: [['DESK001', 5]] })).id);
    await todoOp(tx, (await mk('DELIVERY', { contact: 'Azure Interior', addr: '12 MG Road, Pune', src: L1, dst: C, day: 1, lines: [['DESK001', 5]] })).id);
    await todoOp(tx, (await mk('DELIVERY', { contact: 'Sharma & Co', addr: '44 Industrial Area, Ludhiana', src: L1, dst: C, day: -1, lines: [['CHR002', 10], ['DESK001', 2]] })).id);
    await mk('DELIVERY', { contact: 'Kumar Traders', addr: '7 Mall Road, Jalandhar', src: L1, dst: C, day: 3, lines: [['TBL003', 3]] });
    await todoOp(tx, (await mk('INTERNAL', { src: L1, dst: L2, day: 1, lines: [['PNT007', 10]] })).id);
  }, { timeout: 120_000, maxWait: 20_000 });
  console.log('Demo data created. Logins: arjunk / Admin@123 (manager), priyas / Staff@123 (staff).');
}

await bootstrap();
if (env.seedDemo) await demo();
await prisma.$disconnect();
