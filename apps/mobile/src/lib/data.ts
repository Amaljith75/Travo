import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { DemoAdapter, SupabaseAdapter, TRAVO_SUPABASE, type DataAdapter, type KeyValueStore } from '@travo/core';

/**
 * Chooses the data source at start-up.
 *
 * - By default the app talks to the Travo Supabase project with the public
 *   publishable key (RLS protects all data). Admin dashboard changes reach the
 *   app live through Supabase Realtime.
 * - EXPO_PUBLIC_DATA_MODE=demo runs on persistent sample data on the device.
 *
 * Never put a service-role key in the app.
 */
const demoForced = process.env.EXPO_PUBLIC_DATA_MODE === 'demo';
const url = demoForced ? undefined : process.env.EXPO_PUBLIC_SUPABASE_URL || TRAVO_SUPABASE.url;
const anonKey = demoForced ? undefined : process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || TRAVO_SUPABASE.publishableKey;

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
