'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CircleAlert, CircleCheck } from 'lucide-react';

type Toast = { id: number; kind: 'success' | 'error'; message: string };
const Ctx = createContext<(kind: Toast['kind'], message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast['kind'], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 7000 : 3500);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto flex items-start gap-2 rounded-xl border border-line bg-white p-3 text-sm shadow-lg">
            {t.kind === 'success' ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);

/** Turn any thrown value into a readable message. */
export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');
