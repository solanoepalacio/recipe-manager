'use client';
import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';

export interface AppFooterContextValue {
  slot: HTMLDivElement | null;
  setSlot: (el: HTMLDivElement | null) => void;
  activeCount: number;
  register: () => () => void;
}

export const AppFooterContext = createContext<AppFooterContextValue | null>(null);

export function AppFooterProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<HTMLDivElement | null>(null);
  const [activeCount, setActiveCount] = useState(0);

  const register = useCallback(() => {
    setActiveCount((c) => c + 1);
    return () => setActiveCount((c) => c - 1);
  }, []);

  const value = useMemo<AppFooterContextValue>(
    () => ({ slot, setSlot, activeCount, register }),
    [slot, activeCount, register],
  );

  return <AppFooterContext.Provider value={value}>{children}</AppFooterContext.Provider>;
}
