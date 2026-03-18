interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`bg-subtle animate-pulse rounded ${className}`}
      aria-hidden="true"
    />
  );
}
