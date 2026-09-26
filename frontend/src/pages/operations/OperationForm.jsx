import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useStore } from '../../store/StoreProvider';
import { useGo } from '../../hooks/useGo';
import { COL, PENDING, TYPE_LABEL } from '../../lib/constants';
import { fmtDate, fmtDT, fmtQty, toInput, fromInput } from '../../lib/format';
import {
  prod, loc, userName, internalLocs, virtualId, freeAt, shortLines, isLate,
  createOp, updateOp, todoOp, validateOp, checkAvail, cancelOp, signed,
} from '../../lib/engine';
import { Badge, Pill, LateTag, Field, ReadVal, PName } from '../../components/ui';
import { StatusBar, LineEditor } from '../../components/domain';
import NotFound from '../NotFound';
import {
  Plus, Printer, Hourglass, AlertTriangle, Lock,
} from 'lucide-react';

export default function OperationForm({ type: propType }) {
  const { db, run, toast, user, ask } = useStore();
  const go = useGo();
  const { id: paramId } = useParams();
  const location = useLocation();
  const id = paramId ? Number(paramId) : null;
  const prefill = location.state?.prefill;

  const op = id ? db.operations.find((o) => o.id === id) : null;
  const internals = internalLocs(db);
  const defaults = (t) => t === "RECEIPT" ? { sourceLocId: virtualId(db, "VENDOR"), destLocId: internals[0].id }
    : t === "DELIVERY" ? { sourceLocId: internals[0].id, destLocId: virtualId(db, "CUSTOMER") }
      : { sourceLocId: internals[0].id, destLocId: (internals[1] || internals[0]).id };
  const toLines = (ls) => ls.map((l, i) => ({ k: i + 1, productId: String(l.productId), quantity: String(l.quantity) }));
  const fromOp = (o) => ({ kind: o.type, contact: o.contact, deliveryAddress: o.deliveryAddress, scheduledDate: toInput(o.scheduledDate), sourceLocId: o.sourceLocId, destLocId: o.destLocId, lines: toLines(o.lines) });

  // Determine type from op or prop or URL path
  const resolvedType = op ? op.type : propType || "RECEIPT";

  const [f, setF] = useState(() => op ? fromOp(op) : { kind: resolvedType, contact: "", deliveryAddress: "", scheduledDate: toInput(Date.now()), ...defaults(resolvedType), lines: toLines(prefill || []) });
  const [pick, setPick] = useState({ picked: false, packed: false });
  useEffect(() => { if (op) setF(fromOp(op)); }, [op?.status]); // eslint-disable-line
  if (id && !op) return <NotFound />;

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

  const shortText = (l) => { const p = prod(db, Number(l.productId)); const fr = Math.max(freeAt(db, p.id, Number(f.sourceLocId), op?.id), 0); return { p, fr, gap: Number(l.quantity) - fr }; };

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

  return (
    <div>
      <div className="t3" style={{ fontSize: 13, marginBottom: 4 }}><button type="button" className="lnk2" onClick={backList}>{listName}</button> / <span className="mono">{op ? op.reference : "New"}</span></div>
      <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
        <button type="button" className="btn bs" onClick={() => go("opForm", { type: kind })}><Plus size={16} />New</button>
        <h1 className="h-title" style={{ margin: 0 }}>{TYPE_LABEL[kind]}</h1>
      </div>
      <div className="flex items-center justify-between gap-3 flex-wrap" style={{ padding: "12px 0", borderTop: "1px solid var(--b)", borderBottom: "1px solid var(--b)", marginBottom: 20 }}>
        <div className="flex items-center gap-2 flex-wrap">
          {(status === "NEW" || status === "DRAFT") && <button type="button" className="btn bp" onClick={todo}>To Do</button>}
          {status === "READY" && <button type="button" className="btn bp" onClick={validate} disabled={!pickOk} title={pickOk ? "Validate" : "Tick Picked and Packed first"}>Validate</button>}
          {status === "WAITING" && <button type="button" className="btn bs" onClick={recheck}><Hourglass size={15} />Check Availability</button>}
          <button type="button" className="btn bs" disabled={status !== "DONE"} title={status !== "DONE" ? "Available once Done" : "Print"} onClick={() => go("print", { id: op.id })}>
            <Printer size={16} />Print</button>
          {(PENDING.includes(status) || status === "NEW") && <button type="button" className="btn bd" onClick={cancel}>{status === "NEW" ? "Discard" : "Cancel"}</button>}
          {(status === "NEW" || status === "DRAFT") && <button type="button" className="btn bg" onClick={save}>Save draft</button>}
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
          <LineEditor f={f} setF={setF} editable={editable} outgoing={outgoing} op={op} />
          <div className="t2" style={{ textAlign: "right", fontSize: 13, marginTop: 10 }}>Total: <span className="mono">{f.lines.length}</span> product{f.lines.length !== 1 ? "s" : ""} · <span className="mono">{fmtQty(units)}</span> units</div>
        </div>
      </div>
    </div>
  );
}
