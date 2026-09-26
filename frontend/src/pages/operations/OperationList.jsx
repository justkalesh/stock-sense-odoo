import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../../store/StoreProvider';
import { useGo } from '../../hooks/useGo';
import { STATUS, COL } from '../../lib/constants';
import { fmtDate } from '../../lib/format';
import { loc, isLate, isUpcoming, matchQ } from '../../lib/engine';
import { PageHeader } from '../../components/layout';
import { Badge, LateTag, SearchBox, ViewToggle, ChipSelect, Empty } from '../../components/ui';
import {
  ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Plus, Search, Hourglass,
} from 'lucide-react';

export default function OperationList({ type, kind: k0 }) {
  const { db } = useStore();
  const go = useGo();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'ALL';

  const [kind, setKind] = useState(k0 || type);
  const [tab, setTab] = useState(initialTab); const [q, setQ] = useState(""); const [wh, setWh] = useState("");
  const [view, setView] = useState("list"); const [showCanceled, setShowCanceled] = useState(false);
  const base = db.operations.filter((o) => o.type === kind && (!wh || o.warehouseId === Number(wh)));
  const tabs = [["ALL", "All"], ["DRAFT", "Draft"], ...(kind !== "RECEIPT" ? [["WAITING", "Waiting"]] : []), ["READY", "Ready"], ["DONE", "Done"], ["LATE", "Late"], ["UPCOMING", "Upcoming"]];
  const tabF = (t) => (o) => t === "ALL" ? true : t === "LATE" ? isLate(o) : t === "UPCOMING" ? isUpcoming(o) : o.status === t;
  const searched = base.filter((o) => !q || matchQ(o, q)).sort((a, b) => b.scheduledDate - a.scheduledDate);
  const rows = searched.filter(tabF(tab));
  const title = kind === "RECEIPT" ? "Receipts" : kind === "DELIVERY" ? "Deliveries" : "Internal Transfers";
  const cols = kind === "RECEIPT" ? ["DRAFT", "READY", "DONE"] : ["DRAFT", "WAITING", "READY", "DONE"];
  const canceled = searched.filter((o) => o.status === "CANCELED");
  return (<>
    <PageHeader onNew={() => go("opForm", { type: kind })} title={title}
      right={<><SearchBox value={q} onChange={setQ} placeholder="Search reference or contact" /><ViewToggle v={view} set={setView} /></>} />
    <div className="flex items-end justify-between gap-4 flex-wrap" style={{ marginBottom: 16, borderBottom: view === "list" ? "1px solid var(--b)" : "none" }}>
      {view === "list" ? (
        <div className="tabs" role="tablist">
          {tabs.map(([k, l]) => { const n = searched.filter(tabF(k)).length; return (
            <button type="button" key={k} role="tab" aria-selected={tab === k} className={"tab " + (tab === k ? "on" : "")} onClick={() => setTab(k)}>{l}
              <span className="cnt" style={k === "LATE" && n ? { background: "rgba(255,92,92,.15)", color: "var(--red)" } : undefined}>{n}</span></button>); })}
        </div>) : <div />}
      <div className="flex items-center gap-2" style={{ paddingBottom: 6 }}>
        {type === "DELIVERY" && (
          <div className="seg" role="group" aria-label="Operation type">
            <button type="button" className={kind === "DELIVERY" ? "on" : ""} onClick={() => setKind("DELIVERY")}><ArrowUpFromLine size={14} />Delivery</button>
            <button type="button" className={kind === "INTERNAL" ? "on" : ""} onClick={() => setKind("INTERNAL")}><ArrowLeftRight size={14} />Internal</button>
          </div>)}
        <ChipSelect label="Warehouse" value={wh} onChange={setWh} options={[["", "Warehouse: All"], ...db.warehouses.map((w) => [String(w.id), w.shortCode])]} />
      </div>
    </div>
    {view === "list" ? (
      <div className="card">
        {rows.length ? (<>
          <table className="tbl"><thead><tr><th>Reference</th><th>From</th><th>To</th><th>Contact</th><th>Schedule Date</th><th>Status</th></tr></thead>
            <tbody>{rows.map((o) => (
              <tr key={o.id} className="rc" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && go("opForm", { id: o.id })} onClick={() => go("opForm", { id: o.id })}>
                <td className="mono" style={{ fontWeight: 600, textDecoration: o.status === "CANCELED" ? "line-through" : "none", color: o.status === "CANCELED" ? "var(--t3)" : undefined }}>{o.reference}</td>
                <td className="mono t2">{loc(db, o.sourceLocId).fullName}</td><td className="mono t2">{loc(db, o.destLocId).fullName}</td>
                <td>{o.contact || <span className="t3">—</span>}</td>
                <td><span className="flex items-center gap-2"><span className="mono">{fmtDate(o.scheduledDate)}</span>{isLate(o) && <LateTag />}</span></td>
                <td><span className="flex items-center gap-2"><Badge s={o.status} />{o.status === "WAITING" && <span title="Waiting for stock"><Hourglass size={13} style={{ color: COL.amber }} /></span>}</span></td>
              </tr>))}</tbody></table>
          <div className="t2" style={{ padding: "12px 16px", borderTop: "1px solid var(--b)", fontSize: 13 }}>Showing <span className="mono">{rows.length}</span> of <span className="mono">{base.length}</span></div>
        </>) : base.length ? <Empty icon={Search} title="No matches" sub="Try a different search or tab." />
          : <Empty icon={kind === "RECEIPT" ? ArrowDownToLine : kind === "DELIVERY" ? ArrowUpFromLine : ArrowLeftRight} title={`No ${title.toLowerCase()} yet`}
            sub={kind === "RECEIPT" ? "Receipts record goods arriving from vendors." : kind === "DELIVERY" ? "Deliveries record goods leaving for customers." : "Transfers move stock between locations."}
            action={<button type="button" className="btn bp" onClick={() => go("opForm", { type: kind })}><Plus size={16} />New {kind === "RECEIPT" ? "Receipt" : kind === "DELIVERY" ? "Delivery" : "Internal Transfer"}</button>} />}
      </div>
    ) : (<>
      <div className="flex gap-3" style={{ overflowX: "auto", paddingBottom: 8, alignItems: "flex-start" }}>
        {[...cols, ...(showCanceled ? ["CANCELED"] : [])].map((s) => { const items = searched.filter((o) => o.status === s); return (
          <div key={s} className="kcol">
            <div className="flex items-center justify-between" style={{ padding: "2px 4px" }}>
              <span className="flex items-center gap-2" style={{ fontWeight: 500 }}><i style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS[s].c, display: "inline-block" }} />{STATUS[s].label}</span>
              <span className="cnt">{items.length}</span></div>
            {items.map((o) => (
              <div key={o.id} className="kcard" role="button" tabIndex={0} style={{ borderLeft: `3px solid ${STATUS[s].c}` }}
                onKeyDown={(e) => e.key === "Enter" && go("opForm", { id: o.id })} onClick={() => go("opForm", { id: o.id })}>
                <div className="mono" style={{ fontWeight: 600 }}>{o.reference}</div>
                <div className="t2" style={{ fontSize: 13, marginTop: 2 }}>{o.contact || "—"}</div>
                <div className="flex items-center justify-between" style={{ marginTop: 8, fontSize: 12 }}>
                  <span className="t2 flex items-center gap-2"><span className="mono">{fmtDate(o.scheduledDate)}</span>{isLate(o) && <LateTag />}</span>
                  <span className="t3">{o.lines.length} product{o.lines.length !== 1 ? "s" : ""}</span></div>
              </div>))}
            {!items.length && <div className="t3" style={{ fontSize: 12, padding: "12px 4px" }}>Nothing here</div>}
          </div>); })}
      </div>
      {canceled.length > 0 && <button type="button" className="lnk2" style={{ fontSize: 13, marginTop: 8 }} onClick={() => setShowCanceled(!showCanceled)}>{showCanceled ? "Hide" : "Show"} canceled ({canceled.length})</button>}
    </>)}
  </>);
}
