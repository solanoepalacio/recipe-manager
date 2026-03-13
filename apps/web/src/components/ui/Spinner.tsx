'use client';

export function Spinner() {
  return (
    <div
      role="status"
      aria-label="Cargando..."
      className="inline-block h-5 w-5 border-2 border-stone-200 border-t-green-500 rounded-full animate-spin"
    />
  );
}
