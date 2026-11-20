import React from 'react';

export function Skeleton({ className = 'h-4 w-full' }: { className?: string }) {
  return <div className={`rounded-xl skeleton-shimmer ${className}`} />;
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl p-5 bg-white dark:bg-[#0F142B]/90 border border-[#E7EAF2] dark:border-[#1E2749] space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <StatCardSkeleton key={idx} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-[#E7EAF2] dark:border-[#1E2749] bg-white dark:bg-[#0F142B]/90 p-5 space-y-3">
      <Skeleton className="h-9 w-full" />
      {Array.from({ length: rows }).map((_, idx) => (
        <Skeleton key={idx} className="h-12 w-full" />
      ))}
    </div>
  );
}
