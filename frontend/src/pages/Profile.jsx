import { useState } from 'react';
import { useStore } from '../store/StoreProvider';
import { COL } from '../lib/constants';
import { fmtDate, initials } from '../lib/format';
import { PageHeader } from '../components/layout';
import { Pill, Field, ReadVal, PwInput, RuleList, pwOk } from '../components/ui';
import { Pencil, Lock, LogOut } from 'lucide-react';

export default function Profile() {
  const { act, toast, user, logout } = useStore();
  const [name, setName] = useState(user.name); const [edit, setEdit] = useState(false); const [pw, setPw] = useState({ c: "", a: "", b: "" });
  const saveName = async () => { const r = await act("PATCH", "/me", { name }); if (r.ok) { toast("Profile updated"); setEdit(false); } };
  const pwReady = pw.c && pwOk(pw.a) && pw.a === pw.b;
  const changePw = async (e) => {
    if (e) e.preventDefault();
    if (!pwReady) return;
    const r = await act("POST", "/me/password", { current: pw.c, next: pw.a });
    if (r.ok) { toast("Password updated. Other devices were signed out."); setPw({ c: "", a: "", b: "" }); }
  };
  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <PageHeader title="My Profile" />
      <div className="card" style={{ padding: 24 }}>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="mono" style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--acs)", color: "var(--ac)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 600 }}>{initials(user.name)}</div>
          <div style={{ flex: 1 }}>
            {edit ? <div className="flex gap-2"><input className="inp" autoFocus value={name} onChange={(e) => setName(e.target.value)} style={{ maxWidth: 280 }} onKeyDown={(e) => e.key === "Enter" && saveName()} />
              <button type="button" className="btn bp" onClick={saveName}>Save</button><button type="button" className="btn bs" onClick={() => { setEdit(false); setName(user.name); }}>Cancel</button></div>
              : <div className="flex items-center gap-2"><span className="h-title">{user.name}</span><button type="button" className="ibtn" aria-label="Edit name" onClick={() => setEdit(true)}><Pencil size={15} /></button></div>}
            <div className="flex items-center gap-2" style={{ marginTop: 4 }}><Pill c={user.role === "MANAGER" ? COL.blue : COL.gray}>{user.role === "MANAGER" ? "Manager" : "Staff"}</Pill><span className="t3" style={{ fontSize: 13 }}>Member since {fmtDate(user.createdAt)}</span></div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2" style={{ marginTop: 24 }}>
          <Field label="Login ID"><ReadVal mono><Lock size={14} className="t3" />{user.loginId}</ReadVal></Field>
          <Field label="Email"><ReadVal>{user.email}</ReadVal></Field>
        </div>
      </div>
      <form className="card" style={{ padding: 24, marginTop: 16 }} onSubmit={changePw}>
        <div className="h-sec" style={{ marginBottom: 16 }}>Change Password</div>
        <div className="flex flex-col gap-4" style={{ maxWidth: 400 }}>
          <Field label="Current password"><PwInput value={pw.c} onChange={(v) => setPw({ ...pw, c: v })} /></Field>
          <Field label="New password"><PwInput value={pw.a} onChange={(v) => setPw({ ...pw, a: v })} /><RuleList pw={pw.a} /></Field>
          <Field label="Confirm new password" error={pw.b && pw.a !== pw.b ? "Passwords don't match" : ""}><PwInput value={pw.b} onChange={(v) => setPw({ ...pw, b: v })} /></Field>
          <div><button type="submit" className="btn bp" disabled={!pwReady}>Update password</button></div>
        </div>
      </form>
      <div className="flex items-center gap-3" style={{ marginTop: 16 }}>
        <button type="button" className="btn bd" onClick={logout}><LogOut size={16} />Log out</button>
      </div>
    </div>
  );
}
