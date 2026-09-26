import { useState } from 'react';
import { useStore } from '../../store/StoreProvider';
import { COL } from '../../lib/constants';
import { SettingsLayout, PageHeader } from '../../components/layout';
import { Pill } from '../../components/ui';
import { LocationDrawer } from '../../components/domain';
import { Lock } from 'lucide-react';

export default function Locations() {
  const { db, user } = useStore();
  const mgr = user.role === "MANAGER"; const [dr, setDr] = useState(null);
  const rows = [...db.locations].sort((a, b) => (a.type === "INTERNAL" ? 0 : 1) - (b.type === "INTERNAL" ? 0 : 1));
  const TYPE = { INTERNAL: ["Internal", COL.blue], VENDOR: ["Virtual", COL.gray], CUSTOMER: ["Virtual", COL.gray], LOSS: ["Virtual", COL.gray] };
  return (
    <SettingsLayout active="settingsLoc">
      <PageHeader onNew={() => setDr({})} newDisabled={!mgr} newTitle={mgr ? "New location" : "Only managers can do this"} title="Locations" sub="Rooms, racks and shelves inside a warehouse" />
      <div className="card">
        <table className="tbl"><thead><tr><th>Full Name</th><th>Name</th><th>Short Code</th><th>Warehouse</th><th>Type</th></tr></thead>
          <tbody>{rows.map((l) => { const v = l.type !== "INTERNAL"; const edit = mgr && !v; const wh = db.warehouses.find((w) => w.id === l.warehouseId); return (
            <tr key={l.id} className={edit ? "rc" : ""} tabIndex={edit ? 0 : -1} style={v ? { opacity: 0.7 } : undefined} title={v ? "System location (read-only)" : !mgr ? "Only managers can edit" : "Edit"}
              onKeyDown={(e) => edit && e.key === "Enter" && setDr(l)} onClick={() => edit && setDr(l)}>
              <td className="mono" style={{ fontWeight: 600 }}>{l.fullName}</td><td>{l.name}</td><td className="mono t2">{l.shortCode || "—"}</td>
              <td className="t2">{wh ? `${wh.name} (${wh.shortCode})` : "—"}</td>
              <td><span className="flex items-center gap-2"><Pill c={TYPE[l.type][1]}>{TYPE[l.type][0]}</Pill>{v && <Lock size={13} className="t3" />}</span></td>
            </tr>); })}</tbody></table>
      </div>
      {dr && <LocationDrawer l={dr.id ? dr : null} onClose={() => setDr(null)} />}
    </SettingsLayout>
  );
}
