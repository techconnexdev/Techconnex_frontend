import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function CompanyCardSkeleton() {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6 shrink-0">
        <div className="flex items-start space-x-3 sm:space-x-4">
          <Skeleton className="w-12 h-12 sm:w-16 sm:h-16 rounded-full shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Skeleton className="h-5 w-[min(100%,12rem)]" />
              <Skeleton className="h-5 w-16 rounded-full shrink-0 hidden sm:block" />
            </div>
            <Skeleton className="h-3.5 w-28 sm:w-36 max-w-full" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 flex flex-col flex-1 min-h-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-36 sm:max-w-[55%]" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-4/5" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-8" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-10" />
          </div>
        </div>
        <Skeleton className="h-3.5 w-44 max-w-full" />
        <div className="flex flex-col gap-2 pt-4 border-t border-gray-200 mt-auto shrink-0">
          <Skeleton className="h-9 w-full rounded-md" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1 rounded-md" />
            <Skeleton className="h-9 flex-1 rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProviderCompaniesListSkeleton({
  loadingLabel,
  count = 6,
}: {
  loadingLabel: string;
  count?: number;
}) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{loadingLabel}</span>
      {Array.from({ length: count }).map((_, i) => (
        <CompanyCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Route-level placeholder (`app/provider/companies/loading.tsx`). */
export function ProviderCompaniesPageSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="space-y-2 w-full max-w-xl">
          <Skeleton className="h-8 sm:h-9 w-56 sm:w-72 max-w-full" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <Skeleton className="h-10 w-full sm:w-48 shrink-0" />
      </div>
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </CardContent>
      </Card>
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
          <Skeleton className="h-5 w-40 sm:w-52" />
          <Skeleton className="h-10 w-full sm:w-48 rounded-md" />
        </div>
        <ProviderCompaniesListSkeleton loadingLabel="Loading companies" count={6} />
      </div>
    </div>
  );
}
