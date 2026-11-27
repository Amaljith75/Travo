import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

/**
 * Small persisted device stores for guest mode: favourites and the
 * booking references this device has submitted. When accounts arrive these
 * sync to the `favourites` table / user's bookings.
 */
function createPersistedList<T>(key: string) {
  let value: T[] = [];
  let loaded = false;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  const load = async () => {
    if (loaded) return;
    loaded = true;
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw) value = JSON.parse(raw) as T[];
    } catch {
      value = [];
    }
    emit();
  };

  const save = async (next: T[]) => {
    value = next;
    emit();
    try {
      await AsyncStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Storage full/unavailable — keep in memory for this session.
    }
  };

  return {
    subscribe(l: () => void) {
      listeners.add(l);
      void load();
      return () => listeners.delete(l);
    },
    get: () => value,
    save,
  };
}

const favouritesStore = createPersistedList<string>('travo.favourites.v1');

export interface SavedBooking {
  reference: string;
  phone: string;
  title: string;
  travelDate: string;
  createdAt: string;
}
const bookingsStore = createPersistedList<SavedBooking>('travo.mybookings.v1');

export function useFavourites() {
  const list = useSyncExternalStore(favouritesStore.subscribe, favouritesStore.get, favouritesStore.get);
  const toggle = useCallback((id: string) => {
    const cur = favouritesStore.get();
    void favouritesStore.save(cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur]);
  }, []);
  return { favourites: list, isFavourite: (id: string) => list.includes(id), toggle };
}

export function useSavedBookings() {
  const list = useSyncExternalStore(bookingsStore.subscribe, bookingsStore.get, bookingsStore.get);
  const add = useCallback((b: SavedBooking) => {
    const cur = bookingsStore.get().filter((x) => x.reference !== b.reference);
    void bookingsStore.save([b, ...cur]);
  }, []);
  const remove = useCallback((reference: string) => {
    void bookingsStore.save(bookingsStore.get().filter((x) => x.reference !== reference));
  }, []);
  return { bookings: list, add, remove };
}

/** Debounce a fast-changing value (search input). */
export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
