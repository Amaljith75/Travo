'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { can, type Permission, type SessionUser, type UserRole } from '@travo/core';
import { supabase } from './data';

interface AuthState {
  loading: boolean;
  user: SessionUser | null;
  /** True when the signed-in account has no admin/staff role. */
  forbidden: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, fullName: string): Promise<{ needsConfirmation: boolean }>;
  signOut(): Promise<void>;
  can(p: Permission): boolean;
}

const DEMO_USER: SessionUser = { id: 'demo', email: 'demo@travo.local', fullName: 'Demo Admin', role: 'super_admin', operatorId: null };
const Ctx = createContext<AuthState | null>(null);

async function loadProfile(session: Session | null): Promise<SessionUser | null> {
  if (!supabase || !session) return null;
  const { data } = await supabase.from('user_profiles').select('full_name, role, operator_id').eq('id', session.user.id).maybeSingle();
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    fullName: (data?.full_name as string) ?? null,
    role: ((data?.role as UserRole) ?? 'traveller'),
    operatorId: (data?.operator_id as string) ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(!!supabase);
  const [user, setUser] = useState<SessionUser | null>(supabase ? null : DEMO_USER);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      const u = await loadProfile(data.session);
      if (active) {
        setUser(u);
        setLoading(false);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      loadProfile(session).then((u) => active && setUser(u));
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value: AuthState = {
    loading,
    user,
    forbidden: !!user && !['super_admin', 'admin', 'staff'].includes(user.role),
    async signIn(email, password) {
      if (!supabase) return;
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
    },
    async signUp(email, password, fullName) {
      if (!supabase) return { needsConfirmation: false };
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
      if (error) throw new Error(error.message);
      return { needsConfirmation: !data.session };
    },
    async signOut() {
      if (supabase) await supabase.auth.signOut();
    },
    can: (p) => can(user, p),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside AuthProvider');
  return v;
}
