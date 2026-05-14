import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

export function ProviderProjectsStatsSkeleton() {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6"
      aria-hidden
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-3.5 w-28 sm:w-32 max-w-full" />
                <Skeleton className="h-8 w-10 sm:w-12" />
              </div>
              <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ProviderProjectsListSkeleton({
  loadingLabel,
  count = 4,
}: {
  loadingLabel: string;
  count?: number;
}) {
  return (
    <div
      className="grid gap-4 sm:gap-6"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{loadingLabel}</span>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="sm:hover:shadow-lg transition-shadow">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                  <Skeleton className="h-7 sm:h-8 w-[min(100%,18rem)] max-w-full" />
                  <Skeleton className="h-5 w-20 sm:w-24 shrink-0 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full max-w-3xl" />
                <Skeleton className="h-4 w-full max-w-2xl mt-2" />
                <Skeleton className="h-4 w-3/5 max-w-xl mt-1 hidden sm:block" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0 w-full sm:w-auto">
                <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-36 sm:w-44" />
                  <Skeleton className="h-3 w-28 sm:w-36" />
                </div>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto space-y-2 shrink-0">
                <Skeleton className="h-5 w-32 sm:ml-auto" />
                <Skeleton className="h-3 w-40 sm:ml-auto max-w-full" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-0">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3.5 w-36" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3.5 w-full max-w-md" />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pt-3 sm:pt-4 border-t">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3.5 w-44" />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Skeleton className="h-9 w-full sm:w-[7.5rem] rounded-md" />
                <Skeleton className="h-9 w-full sm:w-[8.5rem] rounded-md" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Full-page placeholder for `app/provider/projects/loading.tsx` (no i18n context). */
export function ProviderProjectsPageSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="space-y-2 w-full max-w-xl">
          <Skeleton className="h-8 sm:h-9 w-56 sm:w-72 max-w-full" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <Skeleton className="h-10 w-full sm:w-44 shrink-0" />
      </div>
      <ProviderProjectsStatsSkeleton />
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Skeleton className="h-10 flex-1 rounded-md" />
            <Skeleton className="h-10 w-full sm:w-48 rounded-md" />
          </div>
        </CardContent>
      </Card>
      <ProviderProjectsListSkeleton
        loadingLabel="Loading projects"
        count={4}
      />
    </div>
  );
}
