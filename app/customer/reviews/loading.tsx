import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerLayout } from "@/components/customer-layout";

export default function CustomerReviewsLoading() {
  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="w-12 h-12 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-6">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-40" />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Filters Skeleton */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-full sm:w-[140px]" />
                    <Skeleton className="h-10 w-full sm:w-[140px]" />
                  </div>
                </CardContent>
              </Card>

              {/* Review Cards Skeleton */}
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <Skeleton className="w-12 h-12 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-48" />
                          </div>
                        </div>
                        <div className="space-y-2 text-right">
                          <Skeleton className="h-5 w-32 ml-auto" />
                          <Skeleton className="h-3 w-24 ml-auto" />
                          <Skeleton className="h-6 w-20 ml-auto rounded-full" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-64" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>

                      {/* Category Ratings */}
                      <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg">
                        {[1, 2, 3, 4].map((j) => (
                          <div
                            key={j}
                            className="flex items-center justify-between"
                          >
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <Skeleton className="h-4 w-48" />
                        <div className="flex gap-2">
                          <Skeleton className="h-9 w-16" />
                          <Skeleton className="h-9 w-16" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Sidebar Skeleton */}
            <div className="space-y-6">
              {/* Rating Distribution */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-40" />
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-2 flex-1" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Category Ratings */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-40" />
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Tips */}
              <Card>
                <CardContent className="p-6 space-y-3">
                  <Skeleton className="h-6 w-28" />
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
