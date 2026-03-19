import { Loader2 } from 'lucide-react';

interface AdminFormProps {
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitLabel: string;
  isPending?: boolean;
  children: React.ReactNode;
}

export function AdminForm({
  title,
  onSubmit,
  onCancel,
  submitLabel,
  isPending,
  children,
}: AdminFormProps) {
  return (
    <form onSubmit={onSubmit} className="bg-background border border-border rounded-[8px] p-6 mb-4">
      <h3
        className="text-[18px] font-semibold text-foreground mb-4"
        style={{ letterSpacing: '-0.3px' }}
      >
        {title}
      </h3>

      <div className="flex flex-col gap-4">{children}</div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="text-[15px] text-secondary"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-accent text-background rounded-[20px] py-2 px-6 text-[15px] font-semibold disabled:opacity-60"
        >
          {isPending && <Loader2 size={16} className="animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
