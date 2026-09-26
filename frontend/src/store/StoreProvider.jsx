import { createContext, useContext, useState, useCallback } from 'react';
import { buildSeed } from '../lib/seed';
import { onHand, freeTotal } from '../lib/engine';

const STORAGE_KEY = 'stocksense:v1';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.db || !parsed.uid) return null;
    // Validate the user still exists
    if (parsed.uid && !parsed.db.users.find((u) => u.id === parsed.uid)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistState(db, uid) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ db, uid }));
  } catch { /* quota exceeded — just skip */ }
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [db, setDb] = useState(() => {
    const saved = loadState();
    return saved ? saved.db : buildSeed();
  });
  const [uid, setUid] = useState(() => {
    const saved = loadState();
    return saved ? saved.uid : null;
  });
  const [toasts, setToasts] = useState([]);
  const [dlg, setDlg] = useState(null);

  const toast = useCallback((msg, kind = "success") => {
    const id = Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 6000 : 4000);
  }, []);

  const run = useCallback((fn) => {
    try {
      const next = structuredClone(db);
      const res = fn(next);
      setDb(next);
      persistState(next, uid);
      return { ok: true, res, db: next };
    } catch (e) {
      toast(e.message, "error");
      return { ok: false };
    }
  }, [db, uid, toast]);

  const user = db.users.find((u) => u.id === uid);

  const login = useCallback((u) => {
    setUid(u.id);
    persistState(db, u.id);
    toast(`Welcome back, ${u.name.split(" ")[0]}.`);
    const low = db.products.filter((p) => {
      const oh = onHand(db, p.id);
      return oh <= 0 || freeTotal(db, p.id) <= p.reorderMin;
    }).length;
    if (low) setTimeout(() => toast(`${low} items are low or out of stock`, "info"), 400);
  }, [db, toast]);

  const logout = useCallback(() => {
    setUid(null);
    persistState(db, null);
    toast("Signed out.", "info");
  }, [db, toast]);

  const ask = useCallback((d) => setDlg(d), []);
  const clearDlg = useCallback(() => setDlg(null), []);

  const resetDemo = useCallback(() => {
    const fresh = buildSeed();
    setDb(fresh);
    setUid(null);
    persistState(fresh, null);
    toast("Demo data reset.", "info");
  }, [toast]);

  const value = { db, run, toast, user, login, logout, ask, dlg, clearDlg, toasts, resetDemo };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
