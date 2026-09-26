import { Outlet } from 'react-router-dom';
import { useStore } from '../../store/StoreProvider';
import { useGo } from '../../hooks/useGo';
import { COL } from '../../lib/constants';
import { initials } from '../../lib/format';
import { Diamond, Pill, Dropdown } from '../ui';
import {
  ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, SlidersHorizontal,
  ChevronDown, User, LogOut, Warehouse as WarehouseIcon, MapPin, Plus,
} from 'lucide-react';

/* Navbar */
export function Navbar() {
  const { user, logout } = useStore();
  const go = useGo();
  // We detect current route from pathname
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  const opsOn = path.startsWith('/receipts') || path.startsWith('/deliveries') || path.startsWith('/internal') || path.startsWith('/operations') || path.startsWith('/adjustments');
  const setOn = path.startsWith('/settings');
  const isDash = path === '/';
  const isStock = path === '/stock';
  const isMoves = path === '/move-history';
  const isProfile = path === '/profile';

  return (
    <header className="nav no-print">
      <button type="button" className="navl" style={{ color: "var(--t)", gap: 10, fontWeight: 600, fontSize: 15 }} onClick={() => go("dashboard")}><Diamond />StockSense</button>
      <nav style={{ display: "flex", gap: 24 }} aria-label="Main">
        <button type="button" className={"navl " + (isDash ? "on" : "")} onClick={() => go("dashboard")}>Dashboard</button>
        <Dropdown trigger={(o, t) => <button type="button" className={"navl " + (opsOn ? "on" : "")} onClick={t} aria-expanded={o}>Operations<ChevronDown size={14} /></button>}>
          <button type="button" className="mi" onClick={() => go("opList", { type: "RECEIPT" })}><ArrowDownToLine size={16} className="t2" />Receipts</button>
          <button type="button" className="mi" onClick={() => go("opList", { type: "DELIVERY" })}><ArrowUpFromLine size={16} className="t2" />Deliveries</button>
          <button type="button" className="mi" onClick={() => go("opList", { type: "DELIVERY", kind: "INTERNAL" })}><ArrowLeftRight size={16} className="t2" />Internal Transfers</button>
          <button type="button" className="mi" onClick={() => go("adjustments")}><SlidersHorizontal size={16} className="t2" />Adjustments</button>
        </Dropdown>
        <button type="button" className={"navl " + (isStock ? "on" : "")} onClick={() => go("stock")}>Stock</button>
        <button type="button" className={"navl " + (isMoves ? "on" : "")} onClick={() => go("moves")}>Move History</button>
        <Dropdown trigger={(o, t) => <button type="button" className={"navl " + (setOn ? "on" : "")} onClick={t} aria-expanded={o}>Settings<ChevronDown size={14} /></button>}>
          <button type="button" className="mi" onClick={() => go("settingsWh")}><WarehouseIcon size={16} className="t2" />Warehouse</button>
          <button type="button" className="mi" onClick={() => go("settingsLoc")}><MapPin size={16} className="t2" />Location</button>
        </Dropdown>
      </nav>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
        <Dropdown align="right" trigger={(o, t) => (
          <button type="button" onClick={t} aria-label="Account menu" aria-expanded={o} className="mono"
            style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--acs)", color: "var(--ac)", border: "1px solid var(--b2)", fontSize: 12, fontWeight: 600, cursor: "pointer", alignSelf: "center" }}>
            {initials(user.name)}</button>)}>
          <div style={{ padding: "8px 10px 10px", borderBottom: "1px solid var(--b2)", marginBottom: 6 }}>
            <div style={{ fontWeight: 600 }}>{user.name}</div>
            <div className="mono t2" style={{ fontSize: 12 }}>{user.loginId}</div>
            <div style={{ marginTop: 6 }}><Pill c={user.role === "MANAGER" ? COL.blue : COL.gray}>{user.role === "MANAGER" ? "Manager" : "Staff"}</Pill></div>
          </div>
          <button type="button" className="mi" onClick={() => go("profile")}><User size={16} className="t2" />My Profile</button>
          <button type="button" className="mi" style={{ color: "var(--red)" }} onClick={logout}><LogOut size={16} />Logout</button>
        </Dropdown>
      </div>
    </header>
  );
}

/* PageHeader */
export function PageHeader({ onNew, newLabel = "New", title, sub, right, newDisabled, newTitle }) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap" style={{ marginBottom: 16 }}>
      <div className="flex items-center gap-3">
        {onNew && <button type="button" className="btn bs" onClick={onNew} disabled={newDisabled} title={newTitle}><Plus size={16} />{newLabel}</button>}
        <div><h1 className="h-title" style={{ margin: 0 }}>{title}</h1>{sub && <div className="t2" style={{ fontSize: 13 }}>{sub}</div>}</div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">{right}</div>
    </div>
  );
}

/* AuthShell */
export function AuthShell({ children }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative" }}>
      <div className="glow" />
      <div style={{ width: 400, maxWidth: "100%", position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div className="flex items-center justify-center gap-3" style={{ fontSize: 24, fontWeight: 600 }}><Diamond s={16} />StockSense</div>
          <div className="t2" style={{ marginTop: 6 }}>Inventory, in real time</div>
        </div>
        <div className="card" style={{ padding: 32 }}>{children}</div>
      </div>
    </div>
  );
}

/* SettingsLayout */
export function SettingsLayout({ active, children }) {
  const go = useGo();
  return (
    <div className="flex gap-6 flex-wrap">
      <nav style={{ width: 200 }} aria-label="Settings">
        <div className="upper" style={{ marginBottom: 8 }}>Settings</div>
        {[["settingsWh", "Warehouse", WarehouseIcon], ["settingsLoc", "Location", MapPin]].map(([r, l, I]) => (
          <button type="button" key={r} className="mi" onClick={() => go(r)} style={active === r ? { background: "var(--s2)", boxShadow: "inset 2px 0 0 var(--ac)" } : undefined}><I size={16} className="t2" />{l}</button>))}
      </nav>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

/* AppLayout — wraps authenticated pages with Navbar + main */
export function AppLayout() {
  return (
    <>
      <Navbar />
      <main style={{ padding: 24, maxWidth: 1440, margin: "0 auto" }}>
        <Outlet />
      </main>
    </>
  );
}
