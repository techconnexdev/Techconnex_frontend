import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function StatCardSkeleton({ withSubline }: { withSubline?: "growth" | "hint" }) {
  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 md:h-4 w-28 md:w-32 max-w-full" />
            <Skeleton className="h-7 md:h-8 w-32 md:w-40 max-w-full" />
            {withSubline === "growth" && (
              <Skeleton className="h-3 w-16 mt-1" />
            )}
            {withSubline === "hint" && (
              <Skeleton className="h-3 w-full max-w-[10rem] mt-2" />
            )}
          </div>
          <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-lg shrink-0 ml-2" />
        </div>
      </CardContent>
    </Card>
  );
}

function MonthlyTrendRowSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="flex items-center space-x-2 md:space-x-3">
        <Skeleton className="w-2 h-2 md:w-3 md:h-3 rounded-full shrink-0" />
        <Skeleton className="h-4 w-24 sm:w-32" />
      </div>
      <div className="flex items-center space-x-2 md:space-x-4">
        <Skeleton className="h-3.5 w-20 md:w-24" />
        <Skeleton className="h-4 w-24 md:w-28" />
      </div>
    </div>
  );
}

function RecentPaymentRowSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg">
      <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
        <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-full shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-[min(100%,14rem)]" />
          <Skeleton className="h-3.5 w-[min(100%,11rem)]" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="text-left sm:text-right space-y-2 shrink-0">
        <Skeleton className="h-4 w-24 sm:ml-auto" />
        <Skeleton className="h-5 w-20 rounded-full sm:ml-auto" />
        <Skeleton className="h-3 w-36 sm:ml-auto" />
      </div>
    </div>
  );
}

export function ProviderEarningsPageSkeleton({
  loadingLabel,
}: {
  loadingLabel: string;
}) {
  return (
    <div
      className="space-y-6 md:space-y-8 px-4 md:px-0"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{loadingLabel}</span>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2 w-full max-w-xl">
          <Skeleton className="h-8 md:h-9 w-48 md:w-64 max-w-full" />
          <Skeleton className="h-4 w-full max-w-lg" />
          <Skeleton className="h-3.5 w-full max-w-md" />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Skeleton className="h-10 w-full sm:w-48 rounded-md" />
          <Skeleton className="h-10 w-full sm:w-auto min-w-[8rem] rounded-md" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCardSkeleton />
        <StatCardSkeleton withSubline="growth" />
        <StatCardSkeleton />
        <StatCardSkeleton withSubline="hint" />
      </div>

      {/* Tabs + overview */}
      <div className="space-y-6">
        <div className="grid w-full grid-cols-3 gap-2 rounded-lg bg-muted p-1">
          <Skeleton className="h-9 rounded-md" />
          <Skeleton className="h-9 rounded-md" />
          <Skeleton className="h-9 rounded-md" />
        </div>

        <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Skeleton className="h-5 w-5 md:h-6 md:w-6 rounded shrink-0" />
                    <Skeleton className="h-6 w-40 md:w-52" />
                  </CardTitle>
                  <Skeleton className="h-10 w-full sm:w-48 rounded-md" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <MonthlyTrendRowSkeleton key={i} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-3.5 w-full max-w-md" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <RecentPaymentRowSkeleton key={i} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-36" />
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2"
                  >
                    <Skeleton className="h-3.5 w-32 md:w-40 max-w-[55%]" />
                    <Skeleton className="h-4 w-16 md:w-20 shrink-0" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
