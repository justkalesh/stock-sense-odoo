import { useState } from 'react';
import { useStore } from '../store/StoreProvider';
import { useGo } from '../hooks/useGo';
import { COL } from '../lib/constants';
import { fmtDT, fmtQty } from '../lib/format';
import { prod, loc, dateOf } from '../lib/engine';
import { PageHeader } from '../components/layout';
import { PName, SearchBox, Empty } from '../components/ui';
import { AdjustDrawer } from '../components/domain';
import { Plus, SlidersHorizontal } from 'lucide-react';

export default function Adjustments() {
  const { db } = useStore();
  const [open, setOpen] = useState(false); const [q, setQ] = useState("");
  const rows = db.operations.filter((o) => o.type === "ADJUSTMENT").map((o) => {
    const plus = loc(db, o.destLocId).type === "INTERNAL"; const l = o.lines[0];
    return { o, p: prod(db, l.productId), at: plus ? o.destLocId : o.sourceLocId, d: plus ? l.quantity : -l.quantity };
  }).filter((r) => !q || `${r.o.reference} ${r.p?.name} ${r.p?.sku}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => dateOf(b.o) - dateOf(a.o));
  return (<>
    <PageHeader title="Adjustments" sub="Correct the system when the physical count disagrees"
      right={<><SearchBox value={q} onChange={setQ} placeholder="Search reference or product" /><button type="button" className="btn bp" onClick={() => setOpen(true)}><Plus size={16} />New Adjustment</button></>} />
    <div className="card">
      {rows.length ? (
        <table className="tbl"><thead><tr><th>Reference</th><th>Date</th><th>Product</th><th>Location</th><th className="r">Δ Qty</th><th>Reason</th><th>By</th></tr></thead>
          <tbody>{rows.map(({ o, p, at, d }) => (
            <tr key={o.id}>
              <td className="mono" style={{ fontWeight: 600, boxShadow: `inset 3px 0 0 ${d > 0 ? COL.green : COL.red}` }}>{o.reference}</td>
              <td className="mono">{fmtDT(dateOf(o))}</td><td><PName p={p} /></td><td className="mono t2">{loc(db, at).fullName}</td>
              <td className="r mono" style={{ color: d > 0 ? COL.green : COL.red, fontWeight: 600 }}>{d > 0 ? "+" : "−"}{fmtQty(Math.abs(d))} <span className="t3">{p?.uom}</span></td>
              <td className="t2">{o.note}</td><td className="t2">{db.users.find((u) => u.id === o.responsibleId)?.name || "—"}</td>
            </tr>))}</tbody></table>
      ) : <Empty icon={SlidersHorizontal} title="No adjustments yet" sub="Adjustments fix mismatches between recorded and counted stock."
        action={<button type="button" className="btn bp" onClick={() => setOpen(true)}><Plus size={16} />New Adjustment</button>} />}
    </div>
    {open && <AdjustDrawer onClose={() => setOpen(false)} />}
  </>);
}
