import { useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../theme/tokens';

export default function RootLayout() {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream }, animation: 'slide_from_right' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="book/confirmation" options={{ gestureEnabled: false, animation: 'fade' }} />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
