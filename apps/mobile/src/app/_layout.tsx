import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { focusManager, QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/data';
import { TABLE_QUERY_KEYS } from '../lib/queries';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../theme/tokens';

/** Refetch affected screens the moment the admin dashboard changes data. */
function LiveSync() {
  const qc = useQueryClient();
  useEffect(() => {
    const unsubscribe = api.subscribe((table) => {
      for (const key of TABLE_QUERY_KEYS[table]) void qc.invalidateQueries({ queryKey: [key] });
    });
    // Also refresh when the app returns to the foreground.
    const sub = AppState.addEventListener('change', (s) => focusManager.setFocused(s === 'active'));
    return () => {
      unsubscribe();
      sub.remove();
    };
  }, [qc]);
  return null;
}

export default function RootLayout() {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: true },
        },
      }),
  );
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <LiveSync />
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream }, animation: 'slide_from_right' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="book/confirmation" options={{ gestureEnabled: false, animation: 'fade' }} />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
