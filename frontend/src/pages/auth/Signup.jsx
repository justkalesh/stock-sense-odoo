import { useState } from 'react';
import { useStore } from '../../store/StoreProvider';
import { useGo } from '../../hooks/useGo';
import { AuthShell } from '../../components/layout';
import { Field, PwInput, RuleList, pwOk } from '../../components/ui';
import { Check } from 'lucide-react';

export default function Signup() {
  const { db, run, toast, login } = useStore();
  const go = useGo();
  const [f, setF] = useState({ id: "", email: "", pw: "", pw2: "" }); const [err, setErr] = useState({});
  const idOk = f.id.length >= 6 && f.id.length <= 12 && /^[A-Za-z0-9._-]+$/.test(f.id);
  const emOk = /^\S+@\S+\.\S+$/.test(f.email);
  const missing = !idOk ? "Login ID must be 6–12 characters" : !emOk ? "Enter a valid email" : !pwOk(f.pw) ? "Complete all password rules" : f.pw !== f.pw2 ? "Passwords must match" : "";
  const submit = (e) => {
    if (e) e.preventDefault();
    if (missing) return;
    const E = {};
    if (db.users.some((u) => u.loginId.toLowerCase() === f.id.toLowerCase())) E.id = "This Login ID is taken.";
    if (db.users.some((u) => u.email.toLowerCase() === f.email.toLowerCase())) E.email = "This email is already registered.";
    setErr(E); if (Object.keys(E).length) return;
    const r = run((d) => { const u = { id: d.nextId++, loginId: f.id, name: f.id, email: f.email, password: f.pw, role: "MANAGER", createdAt: Date.now() }; d.users.push(u); return u; });
    if (r.ok) { login(r.res); go("dashboard"); toast("Account created."); }
  };
  return (
    <AuthShell>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="h-sec">Create your account</div>
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
        <Field label="Password" req><PwInput value={f.pw} onChange={(v) => setF({ ...f, pw: v })} /><RuleList pw={f.pw} /></Field>
        <Field label="Re-enter Password" req error={f.pw2 && f.pw !== f.pw2 ? "Passwords don't match" : ""}>
          <PwInput value={f.pw2} onChange={(v) => setF({ ...f, pw2: v })} />
          {f.pw2 && f.pw === f.pw2 && <div style={{ color: "var(--green)", fontSize: 12, marginTop: 4, display: "flex", gap: 4, alignItems: "center" }}><Check size={12} />Passwords match</div>}
        </Field>
        <button type="submit" className="btn bp blg" disabled={!!missing} title={missing}>Sign Up</button>
        <div className="t2" style={{ fontSize: 13, textAlign: "center" }}>Already have an account? <button type="button" className="lnk" onClick={() => go("login")}>Sign in</button></div>
      </form>
    </AuthShell>
  );
}
