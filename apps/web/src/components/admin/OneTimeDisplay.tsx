'use client';
import { useState } from 'react';

interface OneTimeDisplayProps {
  value: string;
  label: string;
  onDismiss: () => void;
}

export function OneTimeDisplay({ value, label, onDismiss }: OneTimeDisplayProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="bg-sand border border-border rounded-[8px] p-4">
      <p className="text-[13px] text-secondary mb-2">{label}</p>
      <code className="block text-[13px] font-mono text-foreground bg-background rounded px-2 py-1 mb-3 break-all">
        {value}
      </code>
      <div className="flex justify-end gap-3">
        <button
          className="text-[13px] text-accent font-semibold"
          onClick={handleCopy}
        >
          {copied ? 'Copiado' : 'Copiar'}
        </button>
        <button
          className="text-[13px] text-secondary"
          onClick={onDismiss}
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
