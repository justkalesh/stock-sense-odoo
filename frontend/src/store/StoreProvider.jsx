import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { onHand, freeTotal } from '../lib/engine';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [db, setDb] = useState(null);
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [dlg, setDlg] = useState(null);
  const pending = useRef(false);

  const toast = useCallback((msg, kind = "success") => {
    const id = Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 6000 : 4000);
  }, []);

  // Resume an existing session on load
  useEffect(() => {
    api("GET", "/bootstrap")
      .then((r) => { setUser(r.me); setDb(r.db); })
      .catch(() => {})
      .finally(() => setBooting(false));
  }, []);

  // Every change goes through the server, which applies it in one transaction and returns a fresh snapshot of the data
  const act = useCallback(async (method, path, body) => {
    if (pending.current) return { ok: false }; // ignore double-clicks while a change is in flight
    pending.current = true;
    try {
      const r = await api(method, path, body);
      if (r.db) setDb(r.db);
      if (r.me) setUser(r.me);
      return { ok: true, res: r.res, db: r.db };
    } catch (e) {
      if (e.status === 401) { setUser(null); setDb(null); }
      toast(e.message, "error");
      return { ok: false, error: e };
    } finally {
      pending.current = false;
    }
  }, [toast]);

  const signIn = useCallback(({ me, db: data }, { created } = {}) => {
    setUser(me);
    setDb(data);
    toast(created ? "Account created." : `Welcome back, ${me.name.split(" ")[0]}.`);
    const low = data.products.filter((p) => onHand(data, p.id) <= 0 || freeTotal(data, p.id) <= p.reorderMin).length;
    if (low) setTimeout(() => toast(`${low} items are low or out of stock`, "info"), 400);
  }, [toast]);

  const logout = useCallback(async () => {
    await api("POST", "/auth/logout").catch(() => {});
    setUser(null);
    setDb(null);
    toast("Signed out.", "info");
  }, [toast]);

  const ask = useCallback((d) => setDlg(d), []);
  const clearDlg = useCallback(() => setDlg(null), []);

  const value = { db, user, booting, act, toast, signIn, logout, ask, dlg, clearDlg, toasts };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
