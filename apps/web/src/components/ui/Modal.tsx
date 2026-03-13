'use client';

import React, { useEffect } from 'react';

export interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
}

export function Modal({
  isOpen,
  title,
  onClose,
  onBack,
  rightAction,
  children,
}: ModalProps) {
  // Trap focus / prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
        {/* Left action */}
        <div className="w-8">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="text-foreground hover:opacity-70"
              aria-label="Volver"
            >
              ←
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="text-foreground hover:opacity-70 text-xl leading-none"
              aria-label="Cerrar"
            >
              ×
            </button>
          )}
        </div>

        {/* Title */}
        <h2 className="text-base font-semibold text-foreground">{title}</h2>

        {/* Right action */}
        <div className="w-8 flex justify-end">
          {rightAction ?? null}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
