import { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/StoreProvider';
import { useGo } from '../../hooks/useGo';
import { useOutside } from '../../hooks/useOutside';
import { useEsc } from '../../hooks/useEsc';
import { STATUS, COL, UOMS, PENDING, TYPE_LABEL } from '../../lib/constants';
import { fmtDate, fmtDT, fmtQty, inr, toInput } from '../../lib/format';
import {
  prod, loc, qtyAt, internalLocs, freeAt, freeTotal, onHand, dirOf, DIR_COLOR, signed, isOut,
  adjust, saveProduct, saveWarehouse, saveLocation, fail,
} from '../../lib/engine';
import {
  Badge, Pill, PName, LateTag, Field, ReadVal, Drawer, Modal,
} from '../ui';
import {
  Check, Info, ArrowRight, AlertTriangle, Hourglass, Plus, Trash2, Pencil, Lock, X,
} from 'lucide-react';

/* StatusBar */
export function StatusBar({ kind, status }) {
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

/* OpCard */
export function OpCard({ icon: I, title, n, label, onMain, stats, info }) {
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
        <button type="button" className="btn bo blg" style={{ padding: "0 18px", gap: 10 }} onClick={onMain}>
          <span className="mono" style={{ fontSize: 20, fontWeight: 600 }}>{n}</span>{label}<ArrowRight size={16} /></button>
        <div style={{ display: "grid", gap: 4, minWidth: 160 }}>
          {stats.map(([l, v, c, fn]) => (
            <button type="button" key={l} className="lnk2 flex items-center justify-between" style={{ gap: 24 }} onClick={fn}>
              <span>{l}</span><span className="mono" style={{ fontWeight: 600, color: v === 0 ? "var(--t3)" : c || "var(--t)" }}>{v}</span></button>))}
        </div>
      </div>
    </div>
  );
}

/* Kpi */
export const Kpi = ({ label, value, icon: I, color, onClick }) => (
  <button type="button" onClick={onClick} className="card" style={{ padding: 16, textAlign: "left", cursor: "pointer", color: "inherit", fontFamily: "inherit" }}>
    <div className="flex items-center justify-between"><span className="t2" style={{ fontSize: 13 }}>{label}</span>{I && <I size={16} style={{ color: color || COL.t3 }} />}</div>
    <div className="mono" style={{ fontSize: 28, lineHeight: "36px", fontWeight: 600, marginTop: 8, color: color || "var(--t)" }}>{value}</div>
  </button>
);

/* LineEditor */
export function LineEditor({ f, setF, editable, outgoing, op }) {
  const { db, toast } = useStore();
  const warned = useRef(new Set());
  const showFree = outgoing && op?.status !== "DONE" && op?.status !== "CANCELED";
  const freeOf = (pid) => freeAt(db, Number(pid), Number(f.sourceLocId), op?.id);
  const upd = (k, patch) => setF((s) => ({ ...s, lines: s.lines.map((l) => (l.k === k ? { ...l, ...patch } : l)) }));
  const add = () => setF((s) => ({ ...s, lines: [...s.lines, { k: Date.now(), productId: "", quantity: "1" }] }));
  const del = (k) => setF((s) => ({ ...s, lines: s.lines.filter((l) => l.k !== k) }));
  useEffect(() => {
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
                {editable && <td><button type="button" className="ibtn" aria-label="Remove line" onClick={() => del(l.k)}><Trash2 size={15} /></button></td>}
              </tr>);
          })}
          {!f.lines.length && <tr><td colSpan={4} className="t3" style={{ textAlign: "center" }}>No products yet</td></tr>}
        </tbody>
      </table>
    </div>
    {editable && <button type="button" className="lnk" style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6 }} onClick={add}><Plus size={14} />New Product</button>}
  </>);
}

/* StockPopover */
export function StockPopover({ p, whId, onClose }) {
  const { db, run, toast, user } = useStore();
  const ref = useRef(null); useOutside(ref, onClose); useEsc(onClose);
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
          {locs.map((l) => <option key={l.id} value={l.id}>{l.fullName}</option>)}
        </select></Field>
        <Field label="Counted quantity"><input className="inp mono" type="number" min="0" step="any" autoFocus value={c} onChange={(e) => setC(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()} /></Field>
        <div className="flex justify-between" style={{ fontSize: 13 }}><span className="t2">Adjustment</span>
          <span className="mono">{fmtQty(cur)} → {c === "" ? "—" : fmtQty(Number(c))} {ok && <span style={{ color: diff > 0 ? COL.green : COL.red }}>({diff > 0 ? "+" : "−"}{fmtQty(Math.abs(diff))})</span>}</span></div>
        <div className="t3" style={{ fontSize: 12 }}>Will be logged as an adjustment</div>
        <div className="flex justify-end gap-2"><button type="button" className="btn bs bsm" onClick={onClose}>Cancel</button><button type="button" className="btn bp bsm" disabled={!ok} onClick={save}>Update</button></div>
      </div>
    </div>
  );
}

/* ProductDrawer */
export function ProductDrawer({ pid, onClose, onEdit, canDelete }) {
  const { db, run, toast } = useStore();
  const go = useGo();
  const p = prod(db, pid);
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
      footer={<><button type="button" className="btn bd" disabled={!canDelete || hasHistory} title={!canDelete ? "Only managers can do this" : hasHistory ? "Products with stock history can't be deleted" : "Delete"} onClick={del}><Trash2 size={15} />Delete</button>
        <button type="button" className="btn bs" onClick={() => onEdit(p)}><Pencil size={15} />Edit</button></>}>
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
        <button type="button" className="btn bs" onClick={saveRule}>Save</button></div>
      <div className="flex items-center justify-between" style={{ marginTop: 24, marginBottom: 8 }}><span className="upper">Recent moves</span>
        <button type="button" className="lnk" style={{ fontSize: 13 }} onClick={() => go("moves", { product: p.id })}>View all →</button></div>
      {moves.length ? moves.map((m) => { const o = db.operations.find((x) => x.id === m.operationId); const d = o ? dirOf(db, o) : "INT"; return (
        <div key={m.id} className="flex items-center justify-between" style={{ padding: "8px 0", borderBottom: "1px solid var(--b2)", fontSize: 13 }}>
          <div><div className="mono">{m.reference}</div><div className="t3" style={{ fontSize: 12 }}>{fmtDT(m.createdAt)}</div></div>
          <span className="mono" style={{ color: DIR_COLOR[d], fontWeight: 600 }}>{signed(d, m.quantity)}</span></div>); })
        : <div className="t3" style={{ fontSize: 13 }}>No movements yet</div>}
    </Drawer>
  );
}

/* ProductModal */
export function ProductModal({ product, onClose }) {
  const { db, run, toast, user } = useStore();
  const internals = internalLocs(db);
  const [f, setF] = useState(() => product
    ? { id: product.id, name: product.name, sku: product.sku, category: db.categories.find((c) => c.id === product.categoryId)?.name || "", uom: product.uom, unitCost: String(product.unitCost), reorderMin: String(product.reorderMin), reorderMax: String(product.reorderMax) }
    : { name: "", sku: "", category: "", uom: "Units", unitCost: "", initial: "", locationId: internals[0].id, reorderMin: "", reorderMax: "" });
  const [newCat, setNewCat] = useState(false);
  const skuTaken = f.sku && db.products.some((p) => p.sku === f.sku.trim().toUpperCase() && p.id !== f.id);
  const save = () => { const r = run((d) => saveProduct(d, f, user.id));
    if (r.ok) { toast(product ? `${f.name} updated` : `${f.name} created${r.res.ref ? ` · opening stock via ${r.res.ref}` : ""}`); onClose(); } };
  const s = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title={product ? "Edit Product" : "New Product"} onClose={onClose} footer={<><button type="button" className="btn bs" onClick={onClose}>Cancel</button><button type="button" className="btn bp" disabled={!f.name.trim() || !f.sku.trim() || skuTaken} onClick={save}>Save</button></>}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" req><input className="inp" autoFocus value={f.name} onChange={s("name")} placeholder="e.g. Office Desk" /></Field>
        <Field label="SKU" req error={skuTaken ? "This SKU already exists" : ""} hint="Shown as [SKU] Name everywhere"><input className={"inp mono " + (skuTaken ? "err" : "")} value={f.sku} onChange={(e) => setF({ ...f, sku: e.target.value.toUpperCase() })} placeholder="DESK001" /></Field>
        <Field label="Category">
          {newCat ? (
            <div className="flex gap-2"><input className="inp" autoFocus value={f.category} onChange={s("category")} placeholder="New category name" />
              <button type="button" className="ibtn" aria-label="Pick existing category" onClick={() => { setNewCat(false); setF({ ...f, category: "" }); }}><X size={16} /></button></div>
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

/* AdjustDrawer */
export function AdjustDrawer({ onClose }) {
  const { db, run, toast, user } = useStore();
  const internals = internalLocs(db);
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
    <Drawer title="New Adjustment" onClose={onClose} footer={<><button type="button" className="btn bs" onClick={onClose}>Cancel</button><button type="button" className="btn bp" disabled={!valid} onClick={apply}>Apply Adjustment</button></>}>
      <div className="flex flex-col gap-4">
        <Field label="Product" req><select className="inp" autoFocus value={f.productId} onChange={(e) => setF({ ...f, productId: e.target.value, counted: "" })}>
          <option value="">Select product…</option>{db.products.map((x) => <option key={x.id} value={x.id}>[{x.sku}] {x.name}</option>)}
        </select></Field>
        <Field label="Location" req><select className="inp mono" value={f.locationId} onChange={(e) => setF({ ...f, locationId: Number(e.target.value), counted: "" })}>
          {internals.map((l) => <option key={l.id} value={l.id}>{l.fullName}</option>)}
        </select></Field>
        <div className="flex justify-between" style={{ padding: "10px 12px", background: "var(--s2)", borderRadius: 8 }}><span className="t2">Recorded quantity</span>
          <span className="mono">{rec === null ? "—" : `${fmtQty(rec)} ${p.uom}`}</span></div>
        <Field label="Counted quantity" req><input className="inp mono" type="number" min="0" step="any" disabled={!p} value={f.counted} onChange={(e) => setF({ ...f, counted: e.target.value })} /></Field>
        <div><div className="lbl">Difference</div>
          <div className="mono" style={{ fontSize: 28, lineHeight: "36px", fontWeight: 600, color: !valid ? "var(--t3)" : diff > 0 ? COL.green : COL.red }}>
            {diff === null || isNaN(diff) ? "—" : diff === 0 ? "No change" : `${diff > 0 ? "+" : "−"}${fmtQty(Math.abs(diff))} ${p.uom}`}</div></div>
        <Field label="Reason"><select className="inp" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })}>
          {["Damaged", "Lost", "Found", "Count correction"].map((r) => <option key={r}>{r}</option>)}
        </select></Field>
        {valid && <div className="banner info"><Info size={16} style={{ flexShrink: 0 }} /><span>{p.name} @ <span className="mono">{loc(db, Number(f.locationId)).fullName}</span>&nbsp;&nbsp;<span className="mono">{fmtQty(rec)} → {fmtQty(Number(f.counted))}</span></span></div>}
      </div>
    </Drawer>
  );
}

/* WarehouseDrawer */
export function WarehouseDrawer({ w, onClose }) {
  const { db, run, toast } = useStore();
  const [f, setF] = useState({ id: w?.id, name: w?.name || "", shortCode: w?.shortCode || "", address: w?.address || "" });
  const locked = w && db.operations.some((o) => o.warehouseId === w.id);
  const save = () => { const r = run((d) => saveWarehouse(d, f)); if (r.ok) { toast(`${f.name} saved${w ? "" : ` · location ${f.shortCode.toUpperCase()}/Stock created`}`); onClose(); } };
  return (
    <Drawer title={w ? "Edit Warehouse" : "New Warehouse"} onClose={onClose} footer={<><button type="button" className="btn bs" onClick={onClose}>Cancel</button><button type="button" className="btn bp" onClick={save} disabled={!f.name.trim() || !f.shortCode.trim()}>Save</button></>}>
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

/* LocationDrawer */
export function LocationDrawer({ l, onClose }) {
  const { db, run, toast } = useStore();
  const [f, setF] = useState({ id: l?.id, name: l?.name || "", shortCode: l?.shortCode || "", warehouseId: l?.warehouseId || db.warehouses[0]?.id });
  const wh = db.warehouses.find((w) => w.id === Number(f.warehouseId));
  const save = () => { const r = run((d) => saveLocation(d, f)); if (r.ok) { toast(`${r.res.fullName} saved`); onClose(); } };
  return (
    <Drawer title={l ? "Edit Location" : "New Location"} onClose={onClose} footer={<><button type="button" className="btn bs" onClick={onClose}>Cancel</button><button type="button" className="btn bp" onClick={save} disabled={!f.name.trim() || !f.shortCode.trim()}>Save</button></>}>
      <div className="flex flex-col gap-4">
        <Field label="Name" req><input className="inp" autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Rack B" /></Field>
        <Field label="Short Code" req><input className="inp mono" value={f.shortCode} maxLength={12} onChange={(e) => setF({ ...f, shortCode: e.target.value.replace(/\s/g, "") })} placeholder="RackB" /></Field>
        <Field label="Warehouse" req><select className="inp" value={f.warehouseId} onChange={(e) => setF({ ...f, warehouseId: Number(e.target.value) })}>
          {db.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.shortCode})</option>)}
        </select></Field>
        <div className="t2" style={{ fontSize: 13 }}>Full name: <span className="mono" style={{ color: "var(--t)" }}>{wh?.shortCode}/{f.shortCode || "…"}</span></div>
      </div>
    </Drawer>
  );
}
