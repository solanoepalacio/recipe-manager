'use client';

import React from 'react';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Scrim overlay */}
      <div
        data-testid="scrim"
        className="fixed inset-0 z-40 bg-scrim"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-background rounded-t-xl"
        role="dialog"
        aria-modal="true"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div
            data-testid="drag-handle"
            className="w-9 h-1 rounded-full bg-border"
          />
        </div>

        {/* Optional title */}
        {title && (
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[80vh] pb-safe">{children}</div>
      </div>
    </>
  );
}
