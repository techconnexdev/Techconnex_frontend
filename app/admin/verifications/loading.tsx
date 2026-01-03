import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminLayout } from "@/components/admin-layout"

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

export default function AdminVerificationsLoading() {
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-3 sm:h-4 w-20 sm:w-24 mb-2" />
                    <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
                  </div>
                  <Skeleton className="w-6 h-6 sm:w-8 sm:h-8 rounded flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-full sm:w-48" />
              <Skeleton className="h-10 w-full sm:w-48" />
            </div>
          </CardContent>
        </Card>

        {/* Table - Mobile Cards */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle>
              <Skeleton className="h-5 sm:h-6 w-40 sm:w-48" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-3 sm:h-4 w-56 sm:w-72" />
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {/* Mobile Card Layout */}
            <div className="block md:hidden space-y-4 px-4 pb-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-3 bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full flex-shrink-0" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
            {/* Desktop Table Layout */}
            <div className="hidden md:block">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
