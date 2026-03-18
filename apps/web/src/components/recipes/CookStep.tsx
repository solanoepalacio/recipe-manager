import { Check } from 'lucide-react';
import type { StepResponse } from '@recipe-manager/shared';

interface CookStepProps {
  step: StepResponse;
  stepNumber: number;
  status: 'done' | 'current' | 'pending';
  onDone?: () => void;
}

export function CookStep({ step, stepNumber, status, onDone }: CookStepProps) {
  if (status === 'done') {
    return (
      <div className="flex gap-4 px-5 h-[52px] items-center bg-subtle border-b border-border">
        <span className="w-6 h-6 rounded-full bg-placeholder text-background flex items-center justify-center flex-shrink-0">
          <Check size={13} strokeWidth={2.5} />
        </span>
        <span className="text-[13px] text-placeholder truncate flex-1 min-w-0">{step.body}</span>
      </div>
    );
  }

  if (status === 'current') {
    return (
      <div
        className="flex gap-4 py-5 border-b border-subtle items-start border-l-[2.5px] border-l-border pl-[17.5px] pr-5 cursor-pointer"
        onClick={onDone}
        role="button"
        tabIndex={0}
        aria-label={`Marcar paso ${stepNumber} como completado`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onDone?.();
          }
        }}
      >
        <span className="w-6 h-6 rounded-full bg-foreground text-background text-[13px] font-semibold flex items-center justify-center flex-shrink-0 mt-px">
          {stepNumber}
        </span>
        <span className="text-[16px] text-foreground leading-[1.55] tracking-[-0.1px] flex-1">
          {step.body}
        </span>
      </div>
    );
  }

  // pending
  return (
    <div className="flex gap-4 px-5 py-5 border-b border-subtle items-start">
      <span className="w-6 h-6 rounded-full bg-foreground text-background text-[13px] font-semibold flex items-center justify-center flex-shrink-0 mt-px">
        {stepNumber}
      </span>
      <span className="text-[16px] text-foreground leading-[1.55] tracking-[-0.1px] flex-1">
        {step.body}
      </span>
    </div>
  );
}
