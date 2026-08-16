import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("shimmer-skeleton rounded-xl", className)} {...props} />;
}

export { Skeleton };

