'use client';
import { useContext, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AppFooterContext } from './AppFooterContext';

export function AppFooter({ children }: { children: ReactNode }) {
  const ctx = useContext(AppFooterContext);

  useEffect(() => {
    if (!ctx) return;
    return ctx.register();
  }, [ctx]);

  if (!ctx) return <>{children}</>;
  if (!ctx.slot) return null;
  return createPortal(children, ctx.slot);
}
