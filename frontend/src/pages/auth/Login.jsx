import { useState } from 'react';
import { useStore } from '../../store/StoreProvider';
import { useGo } from '../../hooks/useGo';
import { api } from '../../lib/api';
import { AuthShell } from '../../components/layout';
import { Field, PwInput } from '../../components/ui';
import { AlertCircle } from 'lucide-react';

export default function Login() {
  const { signIn } = useStore();
  const go = useGo();
  const [f, setF] = useState({ id: "", pw: "" }); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    if (e) e.preventDefault();
    if (!f.id || !f.pw || busy) return;
    setErr(""); setBusy(true);
    try {
      signIn(await api("POST", "/auth/login", { loginId: f.id.trim(), password: f.pw }));
    } catch (x) {
      setErr(x.status === 401 ? "Invalid Login ID or Password." : x.message);
      setF((s) => ({ ...s, pw: "" }));
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthShell>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {err && <div className="banner err" role="alert"><AlertCircle size={16} />{err}</div>}
        <Field label="Login ID"><input className="inp" autoFocus value={f.id} onChange={(e) => setF({ ...f, id: e.target.value })} placeholder="e.g. arjunk" /></Field>
        <Field label="Password"><PwInput value={f.pw} onChange={(v) => setF({ ...f, pw: v })} /></Field>
        <button type="submit" className="btn bp blg" disabled={busy || !f.id || !f.pw}>{busy ? "Signing in…" : "Sign In"}</button>
        <div className="flex items-center justify-center gap-3" style={{ fontSize: 13 }}>
          <button type="button" className="lnk2" onClick={() => go("forgot")}>Forgot password?</button>
          <span style={{ width: 1, height: 14, background: "var(--b2)" }} />
          <button type="button" className="lnk2" onClick={() => go("signup")}>Sign up</button>
        </div>
      </form>
      <div className="t3 mono" style={{ fontSize: 11, textAlign: "center", marginTop: 20 }}>Demo · arjunk / Admin@123 · priyas / Staff@123</div>
    </AuthShell>
  );
}
