import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store/StoreProvider';
import { useGo } from '../hooks/useGo';
import { COL } from '../lib/constants';
import { fmtQty, inr, inr0 } from '../lib/format';
import { prod, onHand, freeTotal, qtyAt, internalLocs, isOut, stockStatus } from '../lib/engine';
import { PageHeader } from '../components/layout';
import { Pill, PName, SearchBox, ChipSelect, Empty } from '../components/ui';
import { StockPopover, ProductDrawer, ProductModal } from '../components/domain';
import { Plus, Pencil, Search } from 'lucide-react';

export default function Stock() {
  const { db, user } = useStore();
  const go = useGo();
  const [searchParams] = useSearchParams();
  const preset = searchParams.get('low') === '1' ? 'low' : null;

  const [q, setQ] = useState(""); const [cat, setCat] = useState(""); const [wh, setWh] = useState(""); const [low, setLow] = useState(preset === "low");
  const [pop, setPop] = useState(null); const [drawer, setDrawer] = useState(null); const [pm, setPm] = useState(null);
  const W = wh ? Number(wh) : null;
  const all = db.products.filter((p) => (!cat || p.categoryId === Number(cat)) && (!q || `${p.sku} ${p.name}`.toLowerCase().includes(q.toLowerCase())))
    .map((p) => ({ p, oh: onHand(db, p.id, W), fr: freeTotal(db, p.id, W) }));
  const rows = all.filter((r) => !low || r.oh <= 0 || r.fr <= r.p.reorderMin);
  const units = rows.reduce((a, r) => a + r.oh, 0), value = rows.reduce((a, r) => a + r.oh * r.p.unitCost, 0);
  const reservations = (pid) => db.operations.filter((o) => o.status === "READY" && isOut(o) && (!W || o.warehouseId === W))
    .flatMap((o) => o.lines.filter((l) => l.productId === pid).map((l) => `${fmtQty(l.quantity)} reserved for ${o.reference}`));
  return (<>
    <div className="flex items-center justify-between gap-4 flex-wrap" style={{ marginBottom: 16 }}>
      <div className="flex items-center gap-3"><button type="button" className="btn bs" onClick={() => setPm({})}><Plus size={16} />New Product</button><h1 className="h-title" style={{ margin: 0 }}>Stock</h1></div>
      <div className="flex items-center gap-2 flex-wrap">
        <SearchBox value={q} onChange={setQ} placeholder="Search SKU or name" w={240} />
        <ChipSelect label="Category" value={cat} onChange={setCat} options={[["", "Category: All"], ...db.categories.map((c) => [String(c.id), c.name])]} />
        <ChipSelect label="Warehouse" value={wh} onChange={setWh} options={[["", "Warehouse: All"], ...db.warehouses.map((w) => [String(w.id), w.shortCode])]} />
        <label className="flex items-center gap-2 t2" style={{ fontSize: 13, cursor: "pointer", marginLeft: 4 }}><input type="checkbox" className="cb" checked={low} onChange={(e) => setLow(e.target.checked)} />Low stock only</label>
      </div>
    </div>
    <div className="card">
      {rows.length ? (
        <table className="tbl"><thead><tr><th>Product</th><th>Category</th><th>UoM</th><th className="r">Per Unit Cost</th><th className="r">On Hand</th><th className="r">Free to Use</th><th>Status</th></tr></thead>
          <tbody>{rows.map(({ p, oh, fr }) => { const [sl, sc] = stockStatus(oh, fr, p.reorderMin); const res = reservations(p.id); return (
            <tr key={p.id} className="rc" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && e.target === e.currentTarget && setDrawer(p.id)} onClick={() => setDrawer(p.id)}>
              <td><PName p={p} /></td><td className="t2">{db.categories.find((c) => c.id === p.categoryId)?.name || "—"}</td><td className="t2">{p.uom}</td>
              <td className="r mono">{inr(p.unitCost)}</td>
              <td className="r" style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
                <button type="button" className="lnk2 mono" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--t)" }} onClick={() => setPop(p.id)} aria-label={`Update stock for ${p.name}`} title="Update stock">
                  <Pencil size={13} className="t3" />{fmtQty(oh)}</button>
                {pop === p.id && <StockPopover p={p} whId={W} onClose={() => setPop(null)} />}
              </td>
              <td className="r mono" title={res.length ? res.join("\n") : "Nothing reserved"} style={{ color: fr < oh ? COL.t2 : undefined, textDecoration: fr < oh ? "underline dotted" : "none" }}>{fmtQty(Math.max(fr, 0))}</td>
              <td><Pill c={sc}>{sl}</Pill></td>
            </tr>); })}</tbody></table>
      ) : all.length ? <Empty icon={Search} title="No matching products" sub="Try a different search or filter." />
        : <Empty title="No products yet" sub="Add your first product to start tracking stock." action={<button type="button" className="btn bp" onClick={() => setPm({})}><Plus size={16} />New Product</button>} />}
    </div>
    <div className="t2" style={{ fontSize: 13, marginTop: 12 }}><span className="mono">{rows.length}</span> products · <span className="mono">{fmtQty(units)}</span> units on hand · <span className="mono">{inr0(value)}</span> stock value</div>
    {drawer && <ProductDrawer pid={drawer} onClose={() => setDrawer(null)} onEdit={(p) => { setDrawer(null); setPm(p); }} canDelete={user.role === "MANAGER"} />}
    {pm && <ProductModal product={pm.id ? pm : null} onClose={() => setPm(null)} />}
  </>);
}
