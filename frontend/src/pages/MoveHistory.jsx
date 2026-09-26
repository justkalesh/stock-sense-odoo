import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store/StoreProvider';
import { useGo } from '../hooks/useGo';
import { STATUS, COL } from '../lib/constants';
import { fmtDate, fmtQty } from '../lib/format';
import { prod, loc, dirOf, DIR_COLOR, signed, matchQ, dateOf, isOut } from '../lib/engine';
import { PageHeader } from '../components/layout';
import { Badge, PName, SearchBox, ViewToggle, ChipSelect, Dropdown, Empty } from '../components/ui';
import {
  ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal, Plus, ChevronDown, Download, History, X,
} from 'lucide-react';

const openOp = (go, o) => (o.type === "ADJUSTMENT" ? go("adjustments") : go("opForm", { id: o.id }));

export default function MoveHistory() {
  const { db } = useStore();
  const go = useGo();
  const [searchParams] = useSearchParams();
  const initialProduct = searchParams.get('product') || "";

  const [q, setQ] = useState(""); const [type, setType] = useState(""); const [st, setSt] = useState(""); const [dir, setDir] = useState("");
  const [view, setView] = useState("list"); const [pf, setPf] = useState(initialProduct);
  const rows = db.operations.filter((o) => (!type || o.type === type) && (!st || o.status === st) && (!q || matchQ(o, q)) && (!dir || dirOf(db, o) === dir))
    .sort((a, b) => dateOf(b) - dateOf(a))
    .flatMap((o) => o.lines.filter((l) => !pf || l.productId === Number(pf)).map((l, i) => ({ o, l, first: i === 0, d: dirOf(db, o), key: `${o.id}-${l.productId}` })));
  const exportCsv = () => {
    const head = ["Reference", "Date", "Contact", "From", "To", "Product", "Quantity", "Direction", "Status"];
    const lines = [head, ...rows.map((r) => { const p = prod(db, r.l.productId); return [r.o.reference, fmtDate(dateOf(r.o)), r.o.contact, loc(db, r.o.sourceLocId).fullName, loc(db, r.o.destLocId).fullName, `[${p?.sku}] ${p?.name}`, r.l.quantity, r.d, STATUS[r.o.status].label]; })];
    const csv = lines.map((a) => a.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    try { const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); const a = document.createElement("a"); a.href = url; a.download = "move-history.csv"; a.click(); URL.revokeObjectURL(url); }
    catch (e) { /* noop */ }
  };
  const Qty = ({ r }) => { const p = prod(db, r.l.productId); return <span className="mono" style={{ color: DIR_COLOR[r.d], fontWeight: 600 }}>{signed(r.d, r.l.quantity)} <span style={{ fontWeight: 400 }} className="t2">{p?.name}</span></span>; };
  return (<>
    <div className="flex items-center justify-between gap-4 flex-wrap" style={{ marginBottom: 16 }}>
      <div className="flex items-center gap-3">
        <Dropdown trigger={(o, t) => <button type="button" className="btn bs" onClick={t} aria-expanded={o}><Plus size={16} />New<ChevronDown size={14} /></button>}>
          <button type="button" className="mi" onClick={() => go("opForm", { type: "RECEIPT" })}><ArrowDownToLine size={16} className="t2" />New Receipt</button>
          <button type="button" className="mi" onClick={() => go("opForm", { type: "DELIVERY" })}><ArrowUpFromLine size={16} className="t2" />New Delivery</button>
          <button type="button" className="mi" onClick={() => go("adjustments")}><SlidersHorizontal size={16} className="t2" />New Adjustment</button>
        </Dropdown>
        <h1 className="h-title" style={{ margin: 0 }}>Move History</h1></div>
      <div className="flex items-center gap-2"><SearchBox value={q} onChange={setQ} placeholder="Search reference or contact" /><ViewToggle v={view} set={setView} /></div>
    </div>
    <div className="flex items-center justify-between gap-3 flex-wrap" style={{ marginBottom: 16 }}>
      <div className="flex items-center gap-2 flex-wrap">
        <ChipSelect label="Type" value={type} onChange={setType} options={[["", "Type: All"], ["RECEIPT", "Receipts"], ["DELIVERY", "Deliveries"], ["INTERNAL", "Internal"], ["ADJUSTMENT", "Adjustments"]]} />
        <ChipSelect label="Status" value={st} onChange={setSt} options={[["", "Status: All"], ...Object.keys(STATUS).map((s) => [s, STATUS[s].label])]} />
        <ChipSelect label="Direction" value={dir} onChange={setDir} options={[["", "Direction: All"], ["IN", "In"], ["OUT", "Out"], ["INT", "Internal"]]} />
        {pf && <span className="badge" style={{ background: "var(--acs)", color: "var(--ac)", height: 32, borderRadius: 8, padding: "0 10px" }}>Product: {prod(db, Number(pf))?.name}
          <button type="button" className="lnk" aria-label="Clear product filter" onClick={() => setPf("")}><X size={13} /></button></span>}
        <span className="flex items-center gap-3 t2" style={{ fontSize: 12, marginLeft: 8 }}>
          {[["In", COL.green], ["Out", COL.red], ["Internal", COL.t2]].map(([l, c]) => <span key={l} className="flex items-center gap-1"><i style={{ width: 8, height: 8, borderRadius: 9, background: c, display: "inline-block" }} />{l}</span>)}</span>
      </div>
      <button type="button" className="btn bg bsm" onClick={exportCsv}><Download size={14} />Export CSV</button>
    </div>
    {view === "list" ? (
      <div className="card">
        {rows.length ? (
          <table className="tbl"><thead><tr><th>Reference</th><th>Date</th><th>Contact</th><th>From</th><th>To</th><th>Quantity</th><th>Status</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.key} className="rc" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && openOp(go, r.o)} onClick={() => openOp(go, r.o)}>
                <td className="mono" style={{ fontWeight: 600, boxShadow: `inset 3px 0 0 ${DIR_COLOR[r.d]}`, color: r.first ? undefined : "var(--t3)" }}>{r.first ? r.o.reference : "↳"}</td>
                <td className="mono">{fmtDate(dateOf(r.o))}</td><td>{r.o.contact || <span className="t3">—</span>}</td>
                <td className="mono t2">{loc(db, r.o.sourceLocId).fullName}</td><td className="mono t2">{loc(db, r.o.destLocId).fullName}</td>
                <td><Qty r={r} /></td><td><Badge s={r.o.status} /></td>
              </tr>))}</tbody></table>
        ) : <Empty icon={History} title="No movements match" sub="Try clearing the filters." />}
      </div>
    ) : (
      <div className="kanban">
        {["DRAFT", "WAITING", "READY", "DONE", "CANCELED"].map((s) => { const items = rows.filter((r) => r.o.status === s); return (
          <div key={s} className="kcol">
            <div className="flex items-center justify-between" style={{ padding: "2px 4px" }}>
              <span className="flex items-center gap-2" style={{ fontWeight: 500 }}><i style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS[s].c, display: "inline-block" }} />{STATUS[s].label}</span><span className="cnt">{items.length}</span></div>
            {items.map((r) => (
              <div key={r.key} className="kcard" role="button" tabIndex={0} style={{ borderLeft: `3px solid ${DIR_COLOR[r.d]}` }} onKeyDown={(e) => e.key === "Enter" && openOp(go, r.o)} onClick={() => openOp(go, r.o)}>
                <div className="mono" style={{ fontWeight: 600 }}>{r.o.reference}</div>
                <div style={{ marginTop: 4, fontSize: 13 }}><Qty r={r} /></div>
                <div className="t3 mono" style={{ fontSize: 12, marginTop: 6 }}>{fmtDate(dateOf(r.o))}</div>
              </div>))}
            {!items.length && <div className="t3" style={{ fontSize: 12, padding: "12px 4px" }}>Nothing here</div>}
          </div>); })}
      </div>)}
  </>);
}
