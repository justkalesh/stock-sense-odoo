import { Router, type Request, type Response } from 'express';
import { prisma, withTx } from '../db.js';
import { fail } from '../errors.js';
import { checkPassword, hashPassword, requireAuth, requireManager } from '../auth.js';
import { payload } from '../snapshot.js';
import * as inv from '../inventory.js';
import * as v from '../validation.js';

export const dataRouter = Router();
dataRouter.use(requireAuth);

// Every response carries a fresh snapshot, so the UI never shows stale stock after a change
const reply = async (req: Request, res: Response, result: unknown = null) => res.json(await payload(req.user!, result));
const uid = (req: Request) => req.user!.id;
const pid = (req: Request) => v.id.parse(req.params.id);

dataRouter.get('/bootstrap', (req, res) => reply(req, res));

/* ---------- profile ---------- */
dataRouter.patch('/me', async (req, res) => {
  const { name } = v.profile.parse(req.body);
  req.user = await prisma.user.update({ where: { id: uid(req) }, data: { name } });
  await reply(req, res);
});

dataRouter.post('/me/password', async (req, res) => {
  const d = v.changePassword.parse(req.body);
  if (!(await checkPassword(d.current, req.user!.passwordHash))) fail('Current password is incorrect', 400, 'VALIDATION', { current: 'Incorrect' });
  const passwordHash = await hashPassword(d.next);
  // Sign out every other device; keep this one
  await prisma.$transaction([
    prisma.user.update({ where: { id: uid(req) }, data: { passwordHash } }),
    prisma.session.deleteMany({ where: { userId: uid(req), id: { not: req.sessionId! } } }),
  ]);
  res.json({ ok: true });
});

/* ---------- operations ---------- */
dataRouter.post('/operations', async (req, res) => {
  const { todo, ...d } = v.operation.parse(req.body);
  const op = await withTx(async (tx) => {
    const o = await inv.createOp(tx, d, uid(req));
    return todo ? inv.todoOp(tx, o.id) : o;
  });
  await reply(req, res, { id: op.id, reference: op.reference, status: op.status });
});

dataRouter.patch('/operations/:id', async (req, res) => {
  const id = pid(req);
  const { todo, ...d } = v.operation.parse(req.body);
  const op = await withTx(async (tx) => {
    const o = await inv.updateOp(tx, id, d);
    return todo ? inv.todoOp(tx, o.id) : o;
  });
  await reply(req, res, { id: op.id, reference: op.reference, status: op.status });
});

dataRouter.post('/operations/:id/validate', async (req, res) => {
  const id = pid(req);
  await reply(req, res, await withTx((tx) => inv.validateOp(tx, id, uid(req))));
});

dataRouter.post('/operations/:id/check', async (req, res) => {
  const id = pid(req);
  await reply(req, res, { status: await withTx((tx) => inv.checkAvail(tx, id)) });
});

dataRouter.post('/operations/:id/cancel', async (req, res) => {
  const id = pid(req);
  await reply(req, res, await withTx((tx) => inv.cancelOp(tx, id)));
});

dataRouter.post('/adjustments', async (req, res) => {
  const d = v.adjustment.parse(req.body);
  await reply(req, res, await withTx((tx) => inv.adjust(tx, d, uid(req))));
});

/* ---------- products ---------- */
dataRouter.post('/products', async (req, res) => {
  const d = v.product.parse(req.body);
  await reply(req, res, await withTx((tx) => inv.saveProduct(tx, d, uid(req))));
});

dataRouter.patch('/products/:id', async (req, res) => {
  const id = pid(req);
  const d = v.product.parse(req.body);
  await reply(req, res, await withTx((tx) => inv.saveProduct(tx, d, uid(req), id)));
});

dataRouter.patch('/products/:id/reorder', async (req, res) => {
  const id = pid(req);
  const d = v.reorder.parse(req.body);
  await withTx((tx) => inv.setReorder(tx, id, d.min, d.max));
  await reply(req, res);
});

dataRouter.delete('/products/:id', requireManager, async (req, res) => {
  const id = pid(req);
  await withTx((tx) => inv.deleteProduct(tx, id));
  await reply(req, res);
});

/* ---------- settings (managers only) ---------- */
dataRouter.post('/warehouses', requireManager, async (req, res) => {
  const d = v.warehouse.parse(req.body);
  await reply(req, res, await withTx((tx) => inv.saveWarehouse(tx, d)));
});

dataRouter.patch('/warehouses/:id', requireManager, async (req, res) => {
  const id = pid(req);
  const d = v.warehouse.parse(req.body);
  await reply(req, res, await withTx((tx) => inv.saveWarehouse(tx, d, id)));
});

dataRouter.post('/locations', requireManager, async (req, res) => {
  const d = v.location.parse(req.body);
  await reply(req, res, await withTx((tx) => inv.saveLocation(tx, d)));
});

dataRouter.patch('/locations/:id', requireManager, async (req, res) => {
  const id = pid(req);
  const d = v.location.parse(req.body);
  await reply(req, res, await withTx((tx) => inv.saveLocation(tx, d, id)));
});
