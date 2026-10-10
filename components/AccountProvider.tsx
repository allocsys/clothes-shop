'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

// Knows whether this browser is logged in, so the header, menu and tab bar can say "My account" instead of "Log in".
// The pages stay static (fast); the answer comes from /api/auth/me after the page loads.
// A tiny hint in localStorage makes the right label appear at once on the next visit; the server answer always wins.
export type AccountState = 'unknown' | 'in' | 'out';
type Ctx = { state: AccountState; mobile: string; refresh: () => Promise<void> };

const HINT = 'mahpari:account-hint';
const AccountContext = createContext<Ctx>({ state: 'unknown', mobile: '', refresh: async () => {} });

export function useAccount() {
  return useContext(AccountContext);
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AccountState>('unknown');
  const [mobile, setMobile] = useState('');

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = await res.json();
      if (data?.customer) {
        setState('in');
        setMobile(String(data.customer.mobile ?? ''));
        try { localStorage.setItem(HINT, '1'); } catch { /* private mode: fine */ }
      } else {
        setState('out');
        setMobile('');
        try { localStorage.removeItem(HINT); } catch { /* ignore */ }
      }
    } catch {
      // No connection: keep showing what we have.
    }
  }, []);

  useEffect(() => {
    try { if (localStorage.getItem(HINT) === '1') setState('in'); } catch { /* ignore */ }
    void refresh();
  }, [refresh]);

  const value = useMemo(() => ({ state, mobile, refresh }), [state, mobile, refresh]);
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

// Text that switches between the logged-out and logged-in wording.
export function AccountLabel({ out, inn }: { out: string; inn: string }) {
  const { state } = useAccount();
  return <>{state === 'in' ? inn : out}</>;
}
