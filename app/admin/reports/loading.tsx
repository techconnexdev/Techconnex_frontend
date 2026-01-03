import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { AdminLayout } from "@/components/admin-layout"

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

export default function AdminReportsLoading() {
  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <Skeleton className="h-7 sm:h-8 w-48 sm:w-64 mb-2" />
            <Skeleton className="h-3 sm:h-4 w-64 sm:w-96" />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Skeleton className="h-10 w-full sm:w-32" />
            <Skeleton className="h-10 w-full sm:w-40" />
            <Skeleton className="h-10 w-full sm:w-48" />
          </div>
        </div>

        {/* Report Filters */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Skeleton className="h-10 w-full sm:w-48" />
              <Skeleton className="h-10 w-full sm:w-48" />
              <Skeleton className="h-10 w-full sm:w-32" />
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-3 sm:h-4 w-20 sm:w-24 mb-2" />
                    <Skeleton className="h-6 sm:h-8 w-16 sm:w-20 mb-2" />
                    <Skeleton className="h-3 w-12 sm:w-16" />
                  </div>
                  <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex-shrink-0 ml-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Monthly Performance */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
                <Skeleton className="h-5 sm:h-6 w-40 sm:w-48 mb-2" />
                <Skeleton className="h-3 sm:h-4 w-56 sm:w-72" />
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="space-y-4 sm:space-y-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
                        <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-12 sm:w-16" />
                        <Skeleton className="h-3 w-16 sm:w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <div>
            <Card>
              <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
                <Skeleton className="h-5 sm:h-6 w-32 sm:w-40 mb-2" />
                <Skeleton className="h-3 sm:h-4 w-40 sm:w-48" />
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="space-y-3 sm:space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
                        <Skeleton className="h-3 sm:h-4 w-10 sm:w-12" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-12 sm:w-16" />
                        <Skeleton className="h-3 w-10 sm:w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Reports */}
        <Card>
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
            <Skeleton className="h-5 sm:h-6 w-40 sm:w-48 mb-2" />
            <Skeleton className="h-3 sm:h-4 w-56 sm:w-72" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-auto sm:h-20 rounded-lg py-4 sm:py-0" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
