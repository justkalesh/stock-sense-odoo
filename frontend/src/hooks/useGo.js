import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Maps old go(name, params) calls to react-router navigate(path).
 * Drop-in replacement so component bodies barely change.
 */
const ROUTE_MAP = {
  login: () => '/login',
  signup: () => '/signup',
  forgot: () => '/forgot-password',
  dashboard: () => '/',
  opList: (p) => {
    const base = p?.type === 'RECEIPT' ? '/receipts'
      : p?.kind === 'INTERNAL' ? '/internal'
      : '/deliveries';
    const sp = new URLSearchParams();
    if (p?.preset) sp.set('tab', p.preset);
    const qs = sp.toString();
    return qs ? `${base}?${qs}` : base;
  },
  opForm: (p) => {
    if (p?.id) return `/operations/${p.id}`;
    const base = p?.type === 'RECEIPT' ? '/receipts/new'
      : p?.type === 'INTERNAL' || p?.kind === 'INTERNAL' ? '/internal/new'
      : '/deliveries/new';
    return base;
  },
  print: (p) => `/operations/${p?.id}/print`,
  adjustments: () => '/adjustments',
  stock: (p) => {
    if (p?.preset === 'low') return '/stock?low=1';
    return '/stock';
  },
  moves: (p) => {
    if (p?.product) return `/move-history?product=${p.product}`;
    return '/move-history';
  },
  settingsWh: () => '/settings/warehouses',
  settingsLoc: () => '/settings/locations',
  profile: () => '/profile',
};

export function useGo() {
  const navigate = useNavigate();

  const go = useCallback((name, params = {}) => {
    const mapper = ROUTE_MAP[name];
    if (!mapper) {
      navigate('/');
      return;
    }
    const path = mapper(params);

    // Pass prefill lines via navigate state
    const state = params.prefill ? { prefill: params.prefill } : undefined;

    navigate(path, { state });
    try { window.scrollTo(0, 0); } catch { /* noop */ }
  }, [navigate]);

  return go;
}
