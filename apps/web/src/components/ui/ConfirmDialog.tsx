interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive';
}

export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Eliminar',
  cancelLabel,
}: ConfirmDialogProps) {
  return (
    <div className="bg-background border border-border rounded-[8px] p-4 mt-2 shadow-sm">
      <p className="text-[15px] text-foreground mb-3">{message}</p>
      <div className="flex justify-end gap-3">
        <button className="text-[15px] text-secondary" onClick={onCancel}>
          {cancelLabel ?? 'Cancelar'}
        </button>
        <button className="text-[15px] text-destructive font-semibold" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
