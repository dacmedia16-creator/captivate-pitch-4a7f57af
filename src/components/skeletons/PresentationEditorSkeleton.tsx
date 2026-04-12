import { Skeleton } from "@/components/ui/skeleton";

export function PresentationEditorSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2 gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Slides sidebar */}
        <div className="w-56 border-r p-3 space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>

        {/* Main preview */}
        <div className="flex-1 p-8 flex items-start justify-center subtle-grid-bg">
          <Skeleton className="w-full max-w-3xl h-[500px] rounded-xl" />
        </div>

        {/* Edit panel */}
        <div className="w-72 border-l p-4 space-y-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-24 w-full rounded-md" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
