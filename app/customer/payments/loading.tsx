import { Skeleton } from "@/components/ui/skeleton"
import { CustomerLayout } from "@/components/customer-layout"

export default function CustomerPaymentsLoading() {
  return (
    <CustomerLayout>
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-24" />
                </div>
                <Skeleton className="w-8 h-8 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-32" />
          </div>

          {/* Filters Skeleton */}
          <div className="border rounded-lg p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-48" />
            </div>
          </div>

          {/* Transactions List Skeleton */}
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-48 mb-1" />
                      <Skeleton className="h-4 w-64 mb-1" />
                      <Skeleton className="h-3 w-80" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-6 w-24 mb-1" />
                    <Skeleton className="h-6 w-20 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="flex justify-end mt-4 pt-4 border-t">
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}
