'use client';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-stone-200 rounded-md ${className}`}
      role="status"
      aria-label="Cargando..."
    />
  );
}
