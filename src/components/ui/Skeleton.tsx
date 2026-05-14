import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded bg-[#2a2a2a]", className)}
      aria-hidden="true"
    />
  );
}

export function ScoreRingSkeleton() {
  return <Skeleton className="mx-auto h-20 w-20 rounded-full sm:h-24 sm:w-24" />;
}

export function CardSkeleton() {
  return <Skeleton className="h-[120px] w-full rounded-lg" />;
}

export function ChartSkeleton() {
  return <Skeleton className="h-[200px] w-full rounded-lg" />;
}

export function TextSkeleton({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-3 w-32", className)} />;
}
