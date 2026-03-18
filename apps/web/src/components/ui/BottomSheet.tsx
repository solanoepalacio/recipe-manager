'use client';

import { useEffect } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Scrim */}
      <div
        className="fixed inset-0 bg-[rgba(44,44,42,0.35)] z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-[20px]">
        {/* Drag handle bar */}
        <div className="w-9 h-1 bg-border rounded-full mt-3 mb-4 mx-auto" />

        {/* Title */}
        {title && (
          <p className="text-[15px] font-semibold text-foreground text-center mb-4">
            {title}
          </p>
        )}

        {children}
      </div>
    </>
  );
}
