import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProviderProfilePageSkeleton({
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="space-y-2 w-full max-w-xl">
          <Skeleton className="h-8 sm:h-9 w-52 sm:w-64 max-w-full" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <Skeleton className="h-10 w-full sm:w-40 rounded-md shrink-0" />
      </div>

      {/* Profile completion strip */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 py-2.5 px-3 rounded-lg border border-blue-200/80 bg-blue-50/50">
        <Skeleton className="h-2 w-24 sm:w-28 rounded-full" />
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-3.5 flex-1 min-w-[12rem] max-w-md" />
      </div>

      {/* Tabs */}
      <div className="space-y-4 sm:space-y-6">
        <div className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 rounded-lg bg-muted p-1">
          <Skeleton className="h-9 rounded-md" />
          <Skeleton className="h-9 rounded-md" />
          <Skeleton className="h-9 rounded-md" />
          <Skeleton className="h-9 rounded-md" />
        </div>

        {/* Overview layout */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Basic info */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <Skeleton className="h-6 sm:h-7 w-40 sm:w-48" />
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
                        <Skeleton className="h-3.5 w-20" />
                        <Skeleton className="h-10 w-full rounded-md" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-3.5 w-16" />
                        <Skeleton className="h-10 w-full rounded-md" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Skeleton className="h-3.5 w-14" />
                        <Skeleton className="h-10 w-full rounded-md" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-3.5 w-20" />
                        <Skeleton className="h-10 w-full rounded-md" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-20 w-full rounded-md" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resume */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Skeleton className="h-5 w-5 sm:h-6 sm:w-6 rounded shrink-0" />
                  <Skeleton className="h-6 w-36 sm:w-44" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center py-6 sm:py-8 space-y-3">
                  <Skeleton className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg" />
                  <Skeleton className="h-4 w-48 max-w-full" />
                  <Skeleton className="h-9 w-40 rounded-md" />
                </div>
              </CardContent>
            </Card>

            {/* Certifications */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Skeleton className="h-5 w-5 sm:h-6 sm:w-6 rounded shrink-0" />
                    <Skeleton className="h-6 w-40 sm:w-48" />
                  </CardTitle>
                  <Skeleton className="h-9 w-full sm:w-32 rounded-md" />
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 border rounded-lg"
                  >
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg shrink-0" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton className="h-4 w-[min(100%,14rem)]" />
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Skeleton className="h-9 flex-1 sm:w-10 rounded-md" />
                      <Skeleton className="h-9 flex-1 sm:w-10 rounded-md" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar — contact */}
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <Skeleton className="h-5 sm:h-6 w-36" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-3.5 w-16" />
                    <Skeleton className="h-4 w-full max-w-[220px]" />
                  </div>
                ))}
                <div className="space-y-2 pt-1">
                  <Skeleton className="h-3.5 w-24" />
                  <div className="flex flex-wrap gap-1.5">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-14 rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Inline placeholder while certification list is fetching (overview tab). */
export function ProviderProfileCertificationsSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4" aria-hidden>
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 border rounded-lg"
        >
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-4 w-[min(100%,14rem)]" />
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Skeleton className="h-9 w-10 rounded-md" />
            <Skeleton className="h-9 w-10 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
