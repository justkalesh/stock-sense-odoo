import { useState, useRef } from 'react';
import { STATUS, COL } from '../../lib/constants';
import { useOutside } from '../../hooks/useOutside';
import { useEsc } from '../../hooks/useEsc';
import {
  Clock, X, AlertCircle, Check, Eye, EyeOff, Search, List, LayoutGrid, Plus, Boxes,
} from 'lucide-react';

/* Badge */
export const Badge = ({ s }) => {
  const x = STATUS[s];
  return <span className="badge" style={{ color: x.c, background: x.bg ? x.bg + "40" : x.c + "1F" }}><i />{x.label}</span>;
};

/* Pill */
export const Pill = ({ c, children }) => <span className="badge" style={{ color: c, background: c + "1F" }}><i />{children}</span>;

/* LateTag */
export const LateTag = () => <span className="late"><Clock size={11} />Late</span>;

/* PName */
export const PName = ({ p }) => p ? <span><span className="mono t2">[{p.sku}]</span> {p.name}</span> : <span className="t3">—</span>;

/* Diamond */
export const Diamond = ({ s = 14 }) => <span aria-hidden="true" style={{ width: s, height: s, background: "var(--ac)", transform: "rotate(45deg)", borderRadius: 3, display: "inline-block" }} />;

/* Field */
export function Field({ label, req, children, hint, error }) {
  return (
    <div>
      <label className="lbl">{label}{req && <span style={{ color: "var(--ac)" }}> *</span>}</label>
      {children}
      {error ? <div style={{ color: "var(--red)", fontSize: 12, marginTop: 4, display: "flex", gap: 4, alignItems: "center" }}><AlertCircle size={12} />{error}</div>
        : hint ? <div className="t3" style={{ fontSize: 12, marginTop: 4 }}>{hint}</div> : null}
    </div>
  );
}

/* ReadVal */
export const ReadVal = ({ children, mono }) => <div className={mono ? "mono" : ""} style={{ minHeight: 36, display: "flex", alignItems: "center", gap: 8 }}>{children || <span className="t3">—</span>}</div>;

/* PwInput */
export function PwInput({ value, onChange, placeholder, autoFocus }) {
  const [s, setS] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input className="inp" type={s ? "text" : "password"} value={value} autoFocus={autoFocus} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ paddingRight: 40 }} />
      <button type="button" className="ibtn" style={{ position: "absolute", right: 2, top: 2 }} onClick={() => setS(!s)} aria-label={s ? "Hide password" : "Show password"}>{s ? <EyeOff size={16} /> : <Eye size={16} />}</button>
    </div>
  );
}

/* PW_RULES, pwOk, RuleList */
export const PW_RULES = [["At least 8 characters", (p) => p.length >= 8], ["One lowercase letter", (p) => /[a-z]/.test(p)],
  ["One uppercase letter", (p) => /[A-Z]/.test(p)], ["One special character", (p) => /[^A-Za-z0-9]/.test(p)]];
export const pwOk = (p) => PW_RULES.every(([, f]) => f(p));
export const RuleList = ({ pw }) => (
  <ul style={{ marginTop: 8, display: "grid", gap: 4, fontSize: 12 }}>
    {PW_RULES.map(([t, f]) => { const ok = f(pw); return (
      <li key={t} style={{ display: "flex", gap: 6, alignItems: "center", color: ok ? "var(--green)" : "var(--t3)", transition: "color .12s" }}>
        {ok ? <Check size={13} /> : <X size={13} />}{t}</li>); })}
  </ul>
);

/* Drawer */
export function Drawer({ title, onClose, children, footer }) {
  useEsc(onClose);
  return (<>
    <div className="scrim" onClick={onClose} />
    <aside className="drawer" role="dialog" aria-label={typeof title === "string" ? title : "Panel"}>
      <div className="card-h" style={{ borderColor: "var(--b2)" }}><div className="h-sec">{title}</div>
        <button type="button" className="ibtn" aria-label="Close" onClick={onClose}><X size={18} /></button></div>
      <div style={{ padding: 20, overflow: "auto", flex: 1 }}>{children}</div>
      {footer && <div style={{ padding: 16, borderTop: "1px solid var(--b2)", display: "flex", justifyContent: "flex-end", gap: 8 }}>{footer}</div>}
    </aside>
  </>);
}

/* Modal */
export function Modal({ title, onClose, children, footer }) {
  useEsc(onClose);
  return (<>
    <div className="scrim" onClick={onClose} />
    <div className="modal" role="dialog" aria-label={title}>
      <div className="card-h" style={{ borderColor: "var(--b2)" }}><div className="h-sec">{title}</div>
        <button type="button" className="ibtn" aria-label="Close" onClick={onClose}><X size={18} /></button></div>
      <div style={{ padding: 20 }}>{children}</div>
      {footer && <div style={{ padding: 16, borderTop: "1px solid var(--b2)", display: "flex", justifyContent: "flex-end", gap: 8 }}>{footer}</div>}
    </div>
  </>);
}

/* ConfirmDialog */
export function ConfirmDialog({ title, body, confirm = "Confirm", danger, onYes, onClose }) {
  useEsc(onClose);
  return (<>
    <div className="scrim" onClick={onClose} />
    <div className="modal" role="alertdialog" style={{ width: 420 }}>
      <div style={{ padding: 20 }}><div className="h-sec">{title}</div><div className="t2" style={{ marginTop: 8 }}>{body}</div></div>
      <div style={{ padding: "0 20px 20px", display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button type="button" className="btn bs" onClick={onClose}>Back</button>
        <button type="button" className={"btn " + (danger ? "bd" : "bp")} autoFocus onClick={() => { onClose(); onYes(); }}>{confirm}</button>
      </div>
    </div>
  </>);
}

/* Dropdown */
export function Dropdown({ trigger, children, align = "left" }) {
  const [o, setO] = useState(false); const r = useRef(null);
  useOutside(r, () => setO(false));
  return (
    <div ref={r} style={{ position: "relative", display: "flex" }}>
      {trigger(o, () => setO(!o))}
      {o && <div className="menu" style={align === "right" ? { right: 0 } : { left: 0 }} onClick={() => setO(false)}>{children}</div>}
    </div>
  );
}

/* Empty */
export const Empty = ({ icon: I = Boxes, title, sub, action }) => (
  <div style={{ padding: "48px 16px", textAlign: "center" }}>
    <I size={40} className="t3" style={{ margin: "0 auto" }} />
    <div className="h-sec" style={{ marginTop: 12 }}>{title}</div>
    {sub && <div className="t2" style={{ marginTop: 4 }}>{sub}</div>}
    {action && <div style={{ marginTop: 16 }}>{action}</div>}
  </div>
);

/* SearchBox */
export const SearchBox = ({ value, onChange, placeholder, w = 280 }) => (
  <div className="srch" style={{ width: w, maxWidth: "100%" }}><Search size={15} />
    <input className="inp" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} /></div>
);

/* ViewToggle */
export const ViewToggle = ({ v, set }) => (
  <div className="seg" role="group" aria-label="View">
    <button type="button" className={v === "list" ? "on" : ""} onClick={() => set("list")} aria-label="List view" title="List view"><List size={16} /></button>
    <button type="button" className={v === "kanban" ? "on" : ""} onClick={() => set("kanban")} aria-label="Kanban view" title="Kanban view"><LayoutGrid size={16} /></button>
  </div>
);

/* ChipSelect */
export const ChipSelect = ({ value, onChange, options, label }) => (
  <select className="inp chip" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
  </select>
);

/* Toasts */
export const Toasts = ({ list }) => (
  <div className="toasts no-print" role="status" aria-live="polite">
    {list.map((t) => <div key={t.id} className={"toast " + t.kind}>{t.msg}</div>)}
  </div>
);
