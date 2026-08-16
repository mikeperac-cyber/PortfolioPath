"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function LoadingWorkspace() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton className="h-36" key={index} />
      ))}
    </div>
  );
}