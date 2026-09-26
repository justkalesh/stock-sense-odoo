import { MON, DAY } from './constants';

export const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const dayOffset = (n, h = 10) => { const d = new Date(startOfToday() + n * DAY); d.setHours(h, 0, 0, 0); return d.getTime(); };
export const pad = (n) => String(n).padStart(2, "0");
export const fmtDate = (t) => { const d = new Date(t); return `${pad(d.getDate())} ${MON[d.getMonth()]} ${d.getFullYear()}`; };
export const fmtDT = (t) => { const d = new Date(t); return `${fmtDate(t)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
export const toInput = (t) => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
export const fromInput = (s) => { if (!s) return null; const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d, 10).getTime(); };
export const inr = (n) => "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const inr0 = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
export const fmtQty = (n) => Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
export const initials = (n = "") => n.split(/\s+/).filter(Boolean).map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "?";
