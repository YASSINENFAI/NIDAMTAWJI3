import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getUserAppRole, getLinkedPartnerId } from '../lib/auth';
import type { Session } from '@supabase/supabase-js';

export type AppRole = 'admin' | 'supplier' | 'distributor' | 'guest';

export interface AuthState {
  session: Session | null;
  role: AppRole;
  partnerId: string | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>('guest');
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const resolveRole = async (sess: Session | null) => {
    if (!sess) {
      setRole('guest');
      setPartnerId(null);
      setLoading(false);
      return;
    }
    const r = await getUserAppRole();
    setRole(r);
    if (r === 'supplier' || r === 'distributor') {
      const pid = await getLinkedPartnerId();
      setPartnerId(pid);
    } else {
      setPartnerId(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      resolveRole(s);
    });

    // Listen for auth changes (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      resolveRole(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, role, partnerId, loading };
}
