import type { StepResponse } from '@recipe-manager/shared';

interface InstructionListProps {
  steps: StepResponse[];
}

export function InstructionList({ steps }: InstructionListProps) {
  return (
    <div>
      {steps.map((step) => (
        <div key={step.id} className="flex items-center px-5 py-3 border-b border-subtle gap-2">
          <span className="w-6 h-6 rounded-full bg-foreground text-background text-[13px] font-semibold flex items-center justify-center flex-shrink-0">
            {step.order}
          </span>
          <span className="text-[15px] text-foreground flex-1">{step.body}</span>
        </div>
      ))}
    </div>
  );
}
