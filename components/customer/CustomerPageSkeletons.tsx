import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function CustomerStatsCardsSkeleton({
  count = 4,
  className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-3.5 sm:h-4 w-28 sm:w-32 max-w-full" />
                <Skeleton className="h-7 sm:h-8 w-16 sm:w-20" />
              </div>
              <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Customer projects list: 5 stat cards (grid-cols-2 sm:3 lg:5) */
export function CustomerProjectsStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-10" />
              </div>
              <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function CustomerDashboardProjectRowSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-4">
      <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
        <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-4 w-[min(100%,16rem)]" />
          <Skeleton className="h-3.5 w-32 sm:w-40" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-3.5 w-36" />
          </div>
        </div>
      </div>
      <div className="space-y-2 w-full sm:w-auto sm:text-right">
        <Skeleton className="h-4 w-24 sm:ml-auto" />
        <Skeleton className="h-2 w-full sm:w-24 sm:ml-auto rounded-full" />
      </div>
    </div>
  );
}

export function CustomerDashboardRecentProjectsSkeleton({
  loadingLabel,
  rowCount = 4,
}: {
  loadingLabel: string;
  rowCount?: number;
}) {
  return (
    <div
      className="space-y-3 sm:space-y-4"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{loadingLabel}</span>
      {Array.from({ length: rowCount }).map((_, i) => (
        <CustomerDashboardProjectRowSkeleton key={i} />
      ))}
    </div>
  );
}

/** Compact rows for right-panel recommended list */
export function CustomerRecommendedProvidersCompactSkeleton({
  count = 2,
}: {
  count?: number;
}) {
  return (
    <div className="space-y-3 sm:space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-2 sm:gap-3 rounded-lg border p-2 sm:p-3"
        >
          <Skeleton className="w-9 h-9 sm:w-10 sm:h-10 rounded-full shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-3.5 w-[75%] max-w-[180px]" />
            <Skeleton className="h-3 w-1/2 max-w-[120px]" />
            <div className="flex gap-2">
              <Skeleton className="h-7 w-20 rounded-md" />
              <Skeleton className="h-7 w-16 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CustomerProjectCardSkeleton() {
  return (
    <Card className="sm:hover:shadow-lg transition-shadow">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Skeleton className="h-6 sm:h-7 w-[min(100%,14rem)]" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-[80%] max-w-xl mt-2" />
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-3">
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex gap-2 pt-2 border-t">
          <Skeleton className="h-9 flex-1 rounded-md" />
          <Skeleton className="h-9 flex-1 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CustomerProjectsPageSkeleton({ loadingLabel }: { loadingLabel: string }) {
  return (
    <div
      className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{loadingLabel}</span>
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-2 max-w-xl">
          <Skeleton className="h-8 sm:h-9 w-56 sm:w-72" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Skeleton className="h-10 w-full sm:w-36 rounded-md" />
          <Skeleton className="h-10 w-full sm:w-40 rounded-md" />
        </div>
      </div>
      <CustomerProjectsStatsSkeleton />
      <Card>
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Skeleton className="h-10 flex-1 rounded-md" />
            <Skeleton className="h-10 w-full sm:w-48 rounded-md" />
            <Skeleton className="h-10 w-full sm:w-48 rounded-md" />
          </div>
          <div className="flex justify-end mt-3 sm:mt-4 gap-2">
            <Skeleton className="h-9 w-20 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <CustomerProjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function CustomerProviderCardSkeleton({ recommended }: { recommended?: boolean }) {
  const cardClass = recommended
    ? "border-2 border-gray-200 rounded-lg sm:rounded-xl"
    : "";
  return (
    <Card className={cardClass}>
      <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
        <div className="flex items-start space-x-3 sm:space-x-4">
          <Skeleton className="w-12 h-12 sm:w-16 sm:h-16 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40 max-w-full" />
            <Skeleton className="h-3.5 w-28" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
        <div className="flex justify-between gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-12 rounded-md" />
          <Skeleton className="h-12 rounded-md" />
        </div>
        <Skeleton className="h-8 w-full rounded-md" />
      </CardContent>
    </Card>
  );
}

export function CustomerProviderGridSkeleton({
  loadingLabel,
  count = 6,
  recommended = false,
}: {
  loadingLabel: string;
  count?: number;
  recommended?: boolean;
}) {
  const gridClass = recommended
    ? "space-y-3 sm:space-y-4"
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6";
  return (
    <div
      className={gridClass}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{loadingLabel}</span>
      {Array.from({ length: count }).map((_, i) => (
        <CustomerProviderCardSkeleton key={i} recommended={recommended} />
      ))}
    </div>
  );
}

export function CustomerRequestsListSkeleton({
  loadingLabel,
  count = 4,
}: {
  loadingLabel: string;
  count?: number;
}) {
  return (
    <div
      className="flex gap-0 lg:gap-4 relative"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{loadingLabel}</span>
      <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Skeleton className="w-11 h-11 sm:w-12 sm:h-12 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1 min-w-0">
                    <Skeleton className="h-4 w-[min(100%,18rem)]" />
                    <Skeleton className="h-3.5 w-32" />
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-5 w-24 rounded-full" />
                      <Skeleton className="h-5 w-28 rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2 shrink-0 sm:text-right">
                  <Skeleton className="h-5 w-24 sm:ml-auto" />
                  <Skeleton className="h-8 w-full sm:w-28 rounded-md sm:ml-auto" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="hidden lg:block w-[min(100%,380px)] shrink-0">
        <Card className="sticky top-10">
          <CardHeader className="p-4">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6 max-w-full" />
            <Skeleton className="h-4 w-2/3 max-w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function CustomerBillingPageSkeleton({ loadingLabel }: { loadingLabel: string }) {
  return (
    <div
      className="space-y-6 md:space-y-8 px-4 md:px-0"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{loadingLabel}</span>
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-2 max-w-xl">
          <Skeleton className="h-8 md:h-9 w-56 md:w-72" />
          <Skeleton className="h-4 w-full max-w-lg" />
          <Skeleton className="h-3.5 w-full max-w-md" />
        </div>
        <Skeleton className="h-10 w-full sm:w-44 rounded-md" />
      </div>
      <CustomerStatsCardsSkeleton
        count={4}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
      />
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md rounded-md" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border rounded-lg gap-4"
              >
                <div className="flex items-center space-x-4 min-w-0">
                  <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                  <div className="space-y-2 min-w-0">
                    <Skeleton className="h-5 w-48 max-w-full" />
                    <Skeleton className="h-4 w-56 max-w-full" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="text-right space-y-2 shrink-0">
                  <Skeleton className="h-6 w-24 ml-auto" />
                  <Skeleton className="h-5 w-20 ml-auto" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function CustomerSettingsPageSkeleton({ loadingLabel }: { loadingLabel: string }) {
  return (
    <div className="space-y-8" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{loadingLabel}</span>
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 rounded-lg bg-muted p-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 rounded-md" />
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-56 mb-2" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </CardHeader>
        <CardContent className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 rounded-lg border p-4"
            >
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-full max-w-sm" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full shrink-0" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function CustomerDashboardPageSkeleton({ loadingLabel }: { loadingLabel: string }) {
  return (
    <div
      className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{loadingLabel}</span>
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 sm:h-9 w-64 max-w-full" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <Skeleton className="h-10 w-full sm:w-48 rounded-md" />
      </div>
      <CustomerStatsCardsSkeleton count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-9 w-full sm:w-32 rounded-md" />
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <CustomerDashboardRecentProjectsSkeleton
                loadingLabel={loadingLabel}
                rowCount={4}
              />
            </CardContent>
          </Card>
        </div>
        <div className="hidden lg:block">
          <Card>
            <CardHeader className="p-4 sm:p-5">
              <Skeleton className="h-5 w-44" />
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0">
              <CustomerRecommendedProvidersCompactSkeleton count={2} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** Customer profile: header, completion strip, 3 tabs, overview-style cards. */
export function CustomerProfilePageSkeleton({
  loadingLabel,
}: {
  loadingLabel: string;
}) {
  return (
    <div
      className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{loadingLabel}</span>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="space-y-2 w-full max-w-xl">
          <Skeleton className="h-8 sm:h-9 w-52 sm:w-64 max-w-full" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <Skeleton className="h-10 w-full sm:w-40 rounded-md shrink-0" />
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 py-2.5 px-3 rounded-lg border border-blue-200/80 bg-blue-50/50">
        <Skeleton className="h-2 w-24 sm:w-28 rounded-full" />
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-3.5 flex-1 min-w-[12rem] max-w-md" />
      </div>

      <div className="space-y-4 sm:space-y-5 lg:space-y-6">
        <div className="grid w-full grid-cols-3 gap-1 rounded-lg bg-muted p-1">
          <Skeleton className="h-9 rounded-md" />
          <Skeleton className="h-9 rounded-md" />
          <Skeleton className="h-9 rounded-md" />
        </div>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <Skeleton className="h-6 sm:h-7 w-44 sm:w-56" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <div className="relative flex-shrink-0">
                <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-full" />
                <Skeleton className="absolute -bottom-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full" />
              </div>
              <div className="flex-1 min-w-0 space-y-3 sm:space-y-4 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-3.5 w-16" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-24 w-full rounded-md" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2 border-t">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2 text-center sm:text-left">
                  <Skeleton className="h-3 w-20 mx-auto sm:mx-0" />
                  <Skeleton className="h-6 w-12 mx-auto sm:mx-0" />
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2">
              <Skeleton className="h-3.5 w-28" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-28 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <Skeleton className="h-5 sm:h-6 w-40" />
            <Skeleton className="h-3.5 w-full max-w-md mt-2" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <Skeleton className="h-24 w-full rounded-md" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
