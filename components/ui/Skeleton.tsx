import { cn } from "@/lib/cn";

/** Neutral shimmer block used by every loading state. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse bg-cream-dim", className)}
    />
  );
}

/** Placeholder grid shown while a product listing streams in. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          <Skeleton className="aspect-[4/5] w-full" />
          <Skeleton className="mt-4 h-3 w-20" />
          <Skeleton className="mt-3 h-5 w-3/4" />
          <Skeleton className="mt-3 h-4 w-24" />
        </div>
      ))}
    </div>
  );
}
