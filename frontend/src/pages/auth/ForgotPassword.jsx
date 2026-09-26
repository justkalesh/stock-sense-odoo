import { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/StoreProvider';
import { useGo } from '../../hooks/useGo';
import { AuthShell } from '../../components/layout';
import { Field, PwInput, RuleList, pwOk } from '../../components/ui';
import { pad } from '../../lib/format';
import { Check } from 'lucide-react';

export default function ForgotPassword() {
  const { db, run, toast } = useStore();
  const go = useGo();
  const [step, setStep] = useState(0); const [who, setWho] = useState(""); const [otp, setOtp] = useState(null);
  const [dg, setDg] = useState(Array(6).fill("")); const [att, setAtt] = useState(3); const [err, setErr] = useState("");
  const [shake, setShake] = useState(false); const [now, setNow] = useState(Date.now()); const [pw, setPw] = useState({ a: "", b: "" });
  const refs = useRef([]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const send = (e) => {
    if (e) e.preventDefault();
    const k = who.trim().toLowerCase(); if (!k) return;
    const u = db.users.find((x) => x.email.toLowerCase() === k || x.loginId.toLowerCase() === k);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setOtp({ code, uid: u?.id, email: u?.email || who.trim(), exp: Date.now() + 600000, sent: Date.now() });
    setDg(Array(6).fill("")); setAtt(3); setErr(""); setStep(1);
    toast("If an account exists, we've sent a code.", "info");
    setTimeout(() => refs.current[0]?.focus(), 50);
  };
  const setD = (i, v) => {
    const d = v.replace(/\D/g, ""); const nd = [...dg];
    if (d.length > 1) { d.slice(0, 6 - i).split("").forEach((c, j) => (nd[i + j] = c)); setDg(nd); refs.current[Math.min(i + d.length, 5)]?.focus(); return; }
    nd[i] = d; setDg(nd); if (d && i < 5) refs.current[i + 1]?.focus();
  };
  const verify = (e) => {
    if (e) e.preventDefault();
    if (dg.join("").length !== 6) return;
    if (otp.uid && dg.join("") === otp.code && now < otp.exp) { setErr(""); setStep(2); return; }
    const left = att - 1; setAtt(left); setShake(true); setTimeout(() => setShake(false), 350);
    setDg(Array(6).fill("")); refs.current[0]?.focus();
    if (now >= otp.exp) setErr("Code expired. Request a new one.");
    else if (left <= 0) { toast("Too many attempts. Request a new code.", "error"); setStep(0); }
    else setErr(`Incorrect code. ${left} attempt${left > 1 ? "s" : ""} left.`);
  };
  const reset = (e) => {
    if (e) e.preventDefault();
    if (!pwOk(pw.a) || pw.a !== pw.b) return;
    const r = run((d) => { d.users.find((u) => u.id === otp.uid).password = pw.a; });
    if (r.ok) { toast("Password updated. Please sign in."); go("login"); }
  };
  const rem = otp ? Math.max(0, otp.exp - now) : 0;
  const canResend = otp && now - otp.sent >= 30000;
  const mask = (e) => { const [a, b] = e.split("@"); return b ? `${a[0]}••••@${b}` : e; };
  return (
    <AuthShell>
      <div className="flex items-center justify-center gap-2" style={{ marginBottom: 20, fontSize: 12 }}>
        {["Email", "Verify", "New password"].map((s, k) => (
          <div key={s} className="flex items-center gap-2">
            {k > 0 && <span style={{ width: 18, height: 1, background: "var(--b2)" }} />}
            <span className="flex items-center gap-1" style={{ color: k === step ? "var(--ac)" : k < step ? "var(--t2)" : "var(--t3)", fontWeight: k === step ? 600 : 400 }}>
              {k < step ? <Check size={12} /> : <span className="mono">{k + 1}</span>}{s}</span>
          </div>))}
      </div>
      {step === 0 && (
        <form onSubmit={send} className="flex flex-col gap-4">
          <div><div className="h-sec">Reset your password</div><div className="t2" style={{ fontSize: 13, marginTop: 4 }}>Enter your email or Login ID and we'll send a 6-digit code.</div></div>
          <Field label="Email or Login ID"><input className="inp" autoFocus value={who} onChange={(e) => setWho(e.target.value)} /></Field>
          <button type="submit" className="btn bp blg" disabled={!who.trim()}>Send code</button>
        </form>)}
      {step === 1 && (
        <form onSubmit={verify} className="flex flex-col gap-4">
          <div><div className="h-sec">Enter verification code</div><div className="t2" style={{ fontSize: 13, marginTop: 4 }}>We sent a 6-digit code to {mask(otp.email)}</div></div>
          <div className={"flex justify-between " + (shake ? "shake" : "")}>
            {dg.map((v, i) => (
              <input key={i} ref={(el) => (refs.current[i] = el)} className="inp otp mono" inputMode="numeric" aria-label={`Digit ${i + 1}`} value={v}
                onChange={(e) => setD(i, e.target.value)} onKeyDown={(e) => { if (e.key === "Backspace" && !dg[i] && i > 0) refs.current[i - 1]?.focus(); }} />))}
          </div>
          {err && <div style={{ color: "var(--red)", fontSize: 12 }}>{err}</div>}
          <div className="flex justify-between t2" style={{ fontSize: 12 }}>
            <span>Code expires in <span className="mono">{pad(Math.floor(rem / 60000))}:{pad(Math.floor((rem % 60000) / 1000))}</span></span>
            <button type="button" className="lnk" disabled={!canResend} style={{ opacity: canResend ? 1 : 0.4 }} onClick={send}>
              Resend code{!canResend && otp ? ` (0:${pad(Math.ceil((30000 - (now - otp.sent)) / 1000))})` : ""}</button>
          </div>
          <button type="submit" className="btn bp blg" disabled={dg.join("").length !== 6}>Verify</button>
          {otp.uid && <div className="mono t3" style={{ fontSize: 11, textAlign: "center" }}>Dev OTP: {otp.code}</div>}
        </form>)}
      {step === 2 && (
        <form onSubmit={reset} className="flex flex-col gap-4">
          <div className="h-sec">Set a new password</div>
          <Field label="New password" req><PwInput autoFocus value={pw.a} onChange={(v) => setPw({ ...pw, a: v })} /><RuleList pw={pw.a} /></Field>
          <Field label="Confirm new password" req error={pw.b && pw.a !== pw.b ? "Passwords don't match" : ""}><PwInput value={pw.b} onChange={(v) => setPw({ ...pw, b: v })} /></Field>
          <button type="submit" className="btn bp blg" disabled={!pwOk(pw.a) || pw.a !== pw.b}>Update password</button>
        </form>)}
      <div style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}><button type="button" className="lnk2" onClick={() => go("login")}>← Back to sign in</button></div>
    </AuthShell>
  );
}
