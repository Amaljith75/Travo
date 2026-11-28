'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { DemoAdapter, SupabaseAdapter, TRAVO_SUPABASE, type DataAdapter, type KeyValueStore } from '@travo/core';

const demoForced = process.env.NEXT_PUBLIC_DATA_MODE === 'demo';
const url = demoForced ? undefined : process.env.NEXT_PUBLIC_SUPABASE_URL || TRAVO_SUPABASE.url;
const anonKey = demoForced ? undefined : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || TRAVO_SUPABASE.publishableKey;

/** Browser Supabase client (anon key + the signed-in admin's session). */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } }) : null;

const localStore: KeyValueStore = {
  async getItem(k) {
    try {
      return window.localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  async setItem(k, v) {
    window.localStorage.setItem(k, v);
  },
  async removeItem(k) {
    try {
      window.localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

const toDataUrl = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error ?? new Error('Could not read file'));
    r.readAsDataURL(file);
  });

export const api: DataAdapter = supabase ? new SupabaseAdapter(supabase) : new DemoAdapter({ store: localStore, latencyMs: 150, persistBlob: toDataUrl });
export const isDemo = api.mode === 'demo';

export async function resetDemo() {
  if (api instanceof DemoAdapter) await api.reset();
}
