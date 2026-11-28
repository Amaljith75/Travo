'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/data';
import { AuthProvider } from '@/lib/auth';
import { TABLE_KEYS } from '@/lib/queries';
import { ToastProvider } from '@/components/toast';
import { Shell } from '@/components/Shell';

/** Refresh any open screen when data changes anywhere (other admins, the app). */
function LiveSync() {
  const qc = useQueryClient();
  useEffect(
    () =>
      api.subscribe((table) => {
        for (const k of TABLE_KEYS[table]) void qc.invalidateQueries({ queryKey: [k] });
      }),
    [qc],
  );
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true } } }));
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <AuthProvider>
          <LiveSync />
          <Shell>{children}</Shell>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
