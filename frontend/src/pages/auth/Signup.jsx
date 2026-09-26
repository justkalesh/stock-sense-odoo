import { useState } from 'react';
import { useStore } from '../../store/StoreProvider';
import { useGo } from '../../hooks/useGo';
import { api } from '../../lib/api';
import { AuthShell } from '../../components/layout';
import { Field, PwInput, RuleList, pwOk } from '../../components/ui';
import { Check } from 'lucide-react';

const ROLES = [
  ["MANAGER", "Manager", "Manages stock, warehouses and locations"],
  ["STAFF", "Staff", "Handles receipts, deliveries and counts"],
];

export default function Signup() {
  const { signIn, toast } = useStore();
  const go = useGo();
  const [f, setF] = useState({ id: "", email: "", pw: "", pw2: "", role: "STAFF" }); const [err, setErr] = useState({}); const [busy, setBusy] = useState(false);
  const idOk = f.id.length >= 6 && f.id.length <= 12 && /^[A-Za-z0-9._-]+$/.test(f.id);
  const emOk = /^\S+@\S+\.\S+$/.test(f.email);
  const missing = !idOk ? "Login ID must be 6–12 characters" : !emOk ? "Enter a valid email" : !pwOk(f.pw) ? "Complete all password rules" : f.pw !== f.pw2 ? "Passwords must match" : "";
  const submit = async (e) => {
    if (e) e.preventDefault();
    if (missing || busy) return;
    setErr({}); setBusy(true);
    try {
      signIn(await api("POST", "/auth/signup", { loginId: f.id, email: f.email, password: f.pw, role: f.role }), { created: true });
    } catch (x) {
      if (Object.keys(x.fields).length) setErr(x.fields); else toast(x.message, "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthShell>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="h-sec">Create your account</div>
        <Field label="Account type" req hint={ROLES.find(([r]) => r === f.role)[2]}>
          <div className="seg" role="radiogroup" aria-label="Account type" style={{ width: "100%" }}>
            {ROLES.map(([r, label]) => (
              <button type="button" key={r} role="radio" aria-checked={f.role === r} className={f.role === r ? "on" : ""} style={{ flex: 1, height: 32 }}
                onClick={() => setF({ ...f, role: r })}>{label}</button>))}
          </div>
        </Field>
        <Field label="Login ID" req error={err.id} hint="6–12 characters, must be unique">
          <div style={{ position: "relative" }}>
            <input className={"inp " + (err.id ? "err" : "")} autoFocus value={f.id} maxLength={12} onChange={(e) => setF({ ...f, id: e.target.value })} style={{ paddingRight: 52 }} />
            <span className="mono" style={{ position: "absolute", right: 10, top: 9, fontSize: 12, color: idOk ? "var(--green)" : "var(--t3)" }}>{f.id.length}/12</span>
          </div>
        </Field>
        <Field label="Email" req error={err.email}>
          <input className={"inp " + (err.email ? "err" : "")} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          {err.email && <button type="button" className="lnk" style={{ fontSize: 12, marginTop: 4 }} onClick={() => go("login")}>Sign in instead?</button>}
        </Field>
        <Field label="Password" req error={err.password}><PwInput value={f.pw} onChange={(v) => setF({ ...f, pw: v })} /><RuleList pw={f.pw} /></Field>
        <Field label="Re-enter Password" req error={f.pw2 && f.pw !== f.pw2 ? "Passwords don't match" : ""}>
          <PwInput value={f.pw2} onChange={(v) => setF({ ...f, pw2: v })} />
          {f.pw2 && f.pw === f.pw2 && <div style={{ color: "var(--green)", fontSize: 12, marginTop: 4, display: "flex", gap: 4, alignItems: "center" }}><Check size={12} />Passwords match</div>}
        </Field>
        <button type="submit" className="btn bp blg" disabled={!!missing || busy} title={missing}>{busy ? "Creating account…" : "Sign Up"}</button>
        <div className="t2" style={{ fontSize: 13, textAlign: "center" }}>Already have an account? <button type="button" className="lnk" onClick={() => go("login")}>Sign in</button></div>
      </form>
    </AuthShell>
  );
}
