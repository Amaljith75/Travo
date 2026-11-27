import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { DemoAdapter, SupabaseAdapter, type DataAdapter, type KeyValueStore } from '@travo/core';

/**
 * Chooses the data source at start-up.
 *
 * - With EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY set, the app
 *   talks to Supabase using the public anon key (RLS protects all data).
 * - Otherwise it runs in demo mode: real, persistent storage on this device.
 *
 * Never put a service-role key in the app.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const asyncStore: KeyValueStore = {
  getItem: (k) => AsyncStorage.getItem(k),
  setItem: (k, v) => AsyncStorage.setItem(k, v),
  removeItem: (k) => AsyncStorage.removeItem(k),
};

function createAdapter(): DataAdapter {
  if (url && anonKey) {
    const client = createClient(url, anonKey, {
      auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    });
    return new SupabaseAdapter(client);
  }
  return new DemoAdapter({ store: asyncStore, latencyMs: 300 });
}

export const api: DataAdapter = createAdapter();
export const isDemoMode = api.mode === 'demo';

export async function resetDemoData(): Promise<void> {
  if (api instanceof DemoAdapter) await api.reset();
}
