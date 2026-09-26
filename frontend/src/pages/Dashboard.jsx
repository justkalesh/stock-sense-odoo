import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../store/StoreProvider';
import { useGo } from '../hooks/useGo';
import { COL, STATUS, PENDING, WD, WDL, DAY } from '../lib/constants';
import { startOfToday, fmtDate, fmtQty } from '../lib/format';
import { prod, loc, onHand, freeTotal, qtyAt, internalLocs, isLate, isUpcoming, matchQ } from '../lib/engine';
import { PageHeader } from '../components/layout';
import { Badge, LateTag, PName, Pill, ChipSelect, SearchBox, Empty } from '../components/ui';
import { OpCard, Kpi } from '../components/domain';
import {
  ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Boxes, AlertTriangle, PackageX, Plus, Check,
} from 'lucide-react';

const TYPE_LABEL = { RECEIPT: "Receipt", DELIVERY: "Delivery", INTERNAL: "Internal Transfer", ADJUSTMENT: "Adjustment" };
const openOp = (go, o) => (o.type === "ADJUSTMENT" ? go("adjustments") : go("opForm", { id: o.id }));

export default function Dashboard() {
  const { db } = useStore();
  const go = useGo();
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
      {anyFilter && <button type="button" className="btn bg bsm" onClick={() => setF({ type: "", status: "", wh: "", cat: "", q: "" })}>Clear all</button>}
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
        <div className="card-h"><div className="h-sec">Recent Operations</div><button type="button" className="lnk" style={{ fontSize: 13 }} onClick={() => go("moves")}>View all →</button></div>
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
          {alerts.length > 0 && <button type="button" className="btn bs" style={{ width: "100%", marginTop: 16 }} onClick={createReorder}><Plus size={16} />Create receipt</button>}
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
