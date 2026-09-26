import { useState } from 'react';
import { useStore } from '../../store/StoreProvider';
import { SettingsLayout, PageHeader } from '../../components/layout';
import { WarehouseDrawer } from '../../components/domain';

export default function Warehouses() {
  const { db, user } = useStore();
  const mgr = user.role === "MANAGER"; const [dr, setDr] = useState(null);
  return (
    <SettingsLayout active="settingsWh">
      <PageHeader onNew={() => setDr({})} newDisabled={!mgr} newTitle={mgr ? "New warehouse" : "Only managers can do this"} title="Warehouses" sub="Physical sites where stock is stored" />
      <div className="card">
        <table className="tbl"><thead><tr><th>Name</th><th>Short Code</th><th>Address</th><th className="r">Locations</th></tr></thead>
          <tbody>{db.warehouses.map((w) => (
            <tr key={w.id} className={mgr ? "rc" : ""} tabIndex={mgr ? 0 : -1} title={mgr ? "Edit" : "Only managers can edit"} onKeyDown={(e) => mgr && e.key === "Enter" && setDr(w)} onClick={() => mgr && setDr(w)}>
              <td style={{ fontWeight: 500 }}>{w.name}</td><td className="mono">{w.shortCode}</td><td className="t2">{w.address || "—"}</td>
              <td className="r mono">{db.locations.filter((l) => l.warehouseId === w.id).length}</td></tr>))}</tbody></table>
      </div>
      {dr && <WarehouseDrawer w={dr.id ? dr : null} onClose={() => setDr(null)} />}
    </SettingsLayout>
  );
}
